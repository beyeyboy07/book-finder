import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'node:path';
import {
    fileURLToPath
} from 'node:url';
import Wishlist from './models/Wishlist.js';
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
app.use(cors({
    origin: process.env.CLIENT_ORIGIN?.split(',') || true
}));
app.use(express.json({
    limit: '100kb'
}));
const publicDir = path.resolve(__dirname, '../public');
app.use(express.static(publicDir));

app.get('/api/health', (_req, res) => res.json({
    status: 'ok'
}));

app.get('/api/books', async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (!q) return res.status(400).json({
        message: 'Masukkan kata kunci pencarian.'
    });
    if (q.length > 120) return res.status(400).json({
        message: 'Kata kunci terlalu panjang.'
    });

    try {
        const url = new URL('https://www.googleapis.com/books/v1/volumes');
        url.searchParams.set('q', q);
        url.searchParams.set('maxResults', '30');
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Google Books API returned ${response.status}`);
        const payload = await response.json();
        const books = (payload.items || []).map(({
            id,
            volumeInfo = {}
        }) => ({
            googleBookId: id,
            title: volumeInfo.title || 'Untitled',
            authors: volumeInfo.authors || [],
            thumbnail: (volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || '').replace(/^http:/, 'https:'),
            rating: typeof volumeInfo.averageRating === 'number' ? volumeInfo.averageRating : null,
            ratingsCount: volumeInfo.ratingsCount || 0,
            infoLink: volumeInfo.infoLink || '',
            description: volumeInfo.description || '',
        }));
        res.json({
            books,
            totalItems: payload.totalItems || 0
        });
    } catch (error) {
        console.error('Book search failed:', error.message);
        res.status(502).json({
            message: 'Gagal mengambil data dari Google Books. Coba lagi sebentar.'
        });
    }
});

app.get('/api/wishlist', async (_req, res) => {
    try {
        const books = await Wishlist.find().sort({
            createdAt: -1
        }).lean();
        res.json({
            books
        });
    } catch (error) {
        console.error('Wishlist read failed:', error.message);
        res.status(500).json({
            message: 'Wishlist gagal dimuat.'
        });
    }
});

app.post('/api/wishlist', async (req, res) => {
    const {
        googleBookId,
        title,
        authors = [],
        thumbnail = '',
        rating = null,
        infoLink = ''
    } = req.body || {};
    if (!googleBookId || !title) return res.status(400).json({
        message: 'ID buku dan judul wajib diisi.'
    });
    try {
        const book = await Wishlist.findOneAndUpdate({
            googleBookId
        }, {
            $setOnInsert: {
                googleBookId,
                title,
                authors,
                thumbnail,
                rating,
                infoLink
            }
        }, {
            new: true,
            upsert: true,
            runValidators: true
        });
        res.status(201).json({
            book
        });
    } catch (error) {
        console.error('Wishlist save failed:', error.message);
        res.status(500).json({
            message: 'Buku gagal disimpan ke wishlist.'
        });
    }
});

app.delete('/api/wishlist/:googleBookId', async (req, res) => {
    try {
        const result = await Wishlist.findOneAndDelete({
            googleBookId: req.params.googleBookId
        });
        if (!result) return res.status(404).json({
            message: 'Buku tidak ditemukan di wishlist.'
        });
        res.json({
            message: 'Buku dihapus dari wishlist.'
        });
    } catch (error) {
        console.error('Wishlist delete failed:', error.message);
        res.status(500).json({
            message: 'Buku gagal dihapus.'
        });
    }
});

app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(publicDir, 'index.html'), (error) => {
        if (error) next();
    });
});

app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({
        message: 'Terjadi kesalahan pada server.'
    });
});

async function start() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/book_finder');
        console.log('Connected to MongoDB');
        app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
    } catch (error) {
        console.error('Could not connect to MongoDB:', error.message);
        process.exit(1);
    }
}
start();