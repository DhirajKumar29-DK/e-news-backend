import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'articles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^\w-]/g, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${cleanName || 'article'}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif|svg/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowed.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files (JPG, PNG, WebP, GIF, SVG) are allowed!'));
};

export const uploadArticleImage = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter
});

// --- VIDEO UPLOAD SUPPORT ---
const videoUploadDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
if (!fs.existsSync(videoUploadDir)) {
  fs.mkdirSync(videoUploadDir, { recursive: true });
}

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^\w-]/g, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${cleanName || 'video'}-${uniqueSuffix}${ext}`);
  }
});

const videoFileFilter = (req, file, cb) => {
  const allowed = /mp4|webm|mkv|mov|avi|m4v/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('video/') || allowed.test(file.mimetype);

  if (extname || mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only video files (MP4, WebM, MOV, MKV, AVI) are allowed!'));
};

export const uploadVideoFile = multer({
  storage: videoStorage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 } /* 5 GB max upload limit */, // 250 MB
  fileFilter: videoFileFilter
});

// --- ADVERTISEMENT BANNER UPLOAD SUPPORT ---
const adUploadDir = path.join(process.cwd(), 'public', 'uploads', 'ads');
if (!fs.existsSync(adUploadDir)) {
  fs.mkdirSync(adUploadDir, { recursive: true });
}

const adStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, adUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^\w-]/g, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${cleanName || 'ad'}-${uniqueSuffix}${ext}`);
  }
});

export const uploadAdImage = multer({
  storage: adStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter
});

// --- REPORTER IDENTITY PROOF UPLOAD (MANDATORY AADHAAR / PRESS CARD) ---
const idProofUploadDir = path.join(process.cwd(), 'public', 'uploads', 'id_proofs');
if (!fs.existsSync(idProofUploadDir)) {
  fs.mkdirSync(idProofUploadDir, { recursive: true });
}

const idProofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, idProofUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^\w-]/g, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `idproof-${cleanName || 'doc'}-${uniqueSuffix}${ext}`);
  }
});

const idProofFileFilter = (req, file, cb) => {
  const allowedExts = /jpeg|jpg|png|webp|pdf/;
  const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const allowedMime = file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/');

  if (extname && allowedMime) {
    return cb(null, true);
  }
  cb(new Error('Only image files (JPG, PNG, WebP) or PDF documents are allowed for ID proof!'));
};

export const uploadIdProof = multer({
  storage: idProofStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter: idProofFileFilter
});
