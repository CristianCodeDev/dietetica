const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // Cargar variables de entorno
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://crschinocca:95.R6zC6sVx9Z@cluster0.8wnwb.mongodb.net/dietetic-db';

// Conectar a MongoDB
mongoose.set('strictQuery', false); // o true, según lo que prefieras

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error de conexión a MongoDB:', err));



// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Definir el esquema del producto
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
});

const Product = mongoose.model('Product', productSchema);

// Definir el esquema del proveedor
const supplierSchema = new mongoose.Schema({
    name: { type: String, required: true },
});

const Supplier = mongoose.model('Supplier', supplierSchema);

// Endpoint para agregar un producto
app.post('/api/products', async (req, res) => {
    const newProduct = new Product(req.body);
    try {
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Endpoint para obtener productos
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().populate('supplier');
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Endpoint para eliminar un producto
app.delete('/api/products/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(200).json({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Endpoint para editar un producto
app.patch('/api/products/:id', async (req, res) => {
    try {
        const { name, price, supplier } = req.body; 
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, { name, price, supplier }, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error('Error al editar producto:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Endpoint para agregar un proveedor
app.post('/api/suppliers', async (req, res) => {
    const newSupplier = new Supplier(req.body);
    try {
        const savedSupplier = await newSupplier.save();
        res.status(201).json(savedSupplier);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Endpoint para obtener todos los proveedores
app.get('/api/suppliers', async (req, res) => {
    try {
        const suppliers = await Supplier.find();
        res.status(200).json(suppliers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Endpoint para eliminar un proveedor
app.delete('/api/suppliers/:id', async (req, res) => {
    try {
        const supplierToDelete = await Supplier.findById(req.params.id);
        if (!supplierToDelete) {
            return res.status(404).json({ message: 'Proveedor no encontrado' });
        }

        // Solo actualizar los productos relacionados con este proveedor
        await Product.updateMany({ supplier: req.params.id }, { supplier: null });

        // Ahora eliminar el proveedor
        const deletedSupplier = await Supplier.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ message: 'Proveedor eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// Servir la página principal (index.html) en la ruta raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: 'Error interno del servidor' });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
