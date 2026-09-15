import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5050;
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 250 }));

const userSchema = new mongoose.Schema({ name: String, email: { type: String, unique: true, index: true }, passwordHash: String, role: { type: String, enum: ['admin','pharmacist','staff','customer'], default: 'customer' }, active: { type: Boolean, default: true } }, { timestamps: true });
const medicineSchema = new mongoose.Schema({ name: { type: String, index: true }, genericName: { type: String, index: true }, sku: { type: String, unique: true, sparse: true, index: true }, barcode: { type: String, unique: true, sparse: true, index: true }, category: String, brand: String, manufacturer: String, sellingPrice: Number, purchasePrice: Number, stock: { type: Number, default: 0 }, minStock: { type: Number, default: 10 }, prescriptionRequired: Boolean, status: { type: String, default: 'active' } }, { timestamps: true });
const orderSchema = new mongoose.Schema({ orderNumber: { type: String, unique: true, index: true }, customer: String, items: [{ medicine: String, batch: String, quantity: Number, unitPrice: Number }], total: Number, status: { type: String, default: 'Pending' }, payment: { method: { type: String, enum: ['COD','BKASH','NAGAD','ROCKET','CARD','OTHER'], default: 'COD' }, status: { type: String, default: 'Pending' } } }, { timestamps: true });
const User = mongoose.model('User', userSchema); const Medicine = mongoose.model('Medicine', medicineSchema); const Order = mongoose.model('Order', orderSchema);

const sign = user => jwt.sign({ sub: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET || 'development-only-change-me', { expiresIn: '8h' });
const auth = (...roles) => (req,res,next) => { const token = req.headers.authorization?.replace('Bearer ', ''); try { const user = jwt.verify(token, process.env.JWT_SECRET || 'development-only-change-me'); if (roles.length && !roles.includes(user.role)) return res.status(403).json({ error: 'Insufficient permissions' }); req.user=user; next(); } catch { res.status(401).json({ error: 'Authentication required' }); } };
const asyncRoute = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);

app.post('/api/auth/register', asyncRoute(async (req,res) => { const data=z.object({name:z.string().min(2),email:z.string().email(),password:z.string().min(8)}).parse(req.body); if(await User.findOne({email:data.email})) return res.status(409).json({error:'Email already registered'}); const user=await User.create({...data,passwordHash:await bcrypt.hash(data.password,12),role:'customer'}); res.status(201).json({token:sign(user),user:{id:user.id,name:user.name,role:user.role}}); }));
app.post('/api/auth/login', asyncRoute(async(req,res)=>{ const data=z.object({email:z.string().email(),password:z.string().min(1)}).parse(req.body); const user=await User.findOne({email:data.email}); if(!user || !user.active || !await bcrypt.compare(data.password,user.passwordHash)) return res.status(401).json({error:'Invalid credentials'}); res.json({token:sign(user),user:{id:user.id,name:user.name,role:user.role}}); }));
app.get('/api/medicines', asyncRoute(async(req,res)=>{ const q=req.query.q ? {$or:[{name:new RegExp(req.query.q,'i')},{genericName:new RegExp(req.query.q,'i')},{barcode:req.query.q}]} : {}; res.json({data:await Medicine.find(q).limit(100)}); }));
app.post('/api/medicines',auth('admin','pharmacist'),asyncRoute(async(req,res)=>{ const data=z.object({name:z.string().min(2),sellingPrice:z.number().nonnegative(),stock:z.number().nonnegative().default(0)}).passthrough().parse(req.body); res.status(201).json({data:await Medicine.create(data)}); }));
app.get('/api/orders',auth('admin','pharmacist','staff'),asyncRoute(async(req,res)=>res.json({data:await Order.find().sort('-createdAt').limit(100)})));
app.patch('/api/orders/:id/status',auth('admin','pharmacist','staff'),asyncRoute(async(req,res)=>{ const status=z.enum(['Pending','Confirmed','Processing','Ready','Out for Delivery','Delivered','Cancelled','Rejected','Returned']).parse(req.body.status); const order=await Order.findByIdAndUpdate(req.params.id,{status,...(status==='Delivered'?{'payment.status':'Paid'}:{}),...(status==='Cancelled'?{'payment.status':'Not Collected'}:{})},{new:true}); res.json({data:order}); }));
app.get('/api/health',(_,res)=>res.json({status:'ok',service:'PharmaPulse API'}));
app.use(express.static(path.join(__dirname,'public'))); app.get('*',(_,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.use((err,req,res,next)=>{ if(err instanceof z.ZodError)return res.status(400).json({error:'Validation failed',details:err.flatten()}); console.error(err); res.status(500).json({error:'Unexpected server error'}); });
app.listen(PORT,()=>console.log(`PharmaPulse: http://localhost:${PORT}`));
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pharmapulse', { serverSelectionTimeoutMS: 5000 })
  .then(()=>console.log('MongoDB connected'))
  .catch(err=>console.warn('MongoDB unavailable; API data routes require a database:', err.message));
