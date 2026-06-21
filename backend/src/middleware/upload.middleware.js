import multer from 'multer';
import path from 'path';


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});


const checkFileType = (file, cb) => {
  
  const filetypes = /pdf|doc|docx|txt/;
  
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'application/pdf' || file.mimetype === 'text/plain' || file.mimetype.includes('word');

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Documents only! (PDF, DOC, DOCX, TXT)'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10000000 }, 
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
});

export default upload;
