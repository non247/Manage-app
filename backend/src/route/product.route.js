// const express = require('express');
// const router = express.Router();
// const productController = require('../controller/product.controller');

// router.get('/', productController.getAllProducts);
// router.get('/:id', productController.getProductById);
// router.post('/', productController.createProduct);
// router.put('/:id', productController.updateProduct);
// router.delete('/:id', productController.deleteProduct);

// module.exports = router;

const express = require('express');
const router = express.Router();
const productController = require('../controller/product.controller');

const upload = require('../middleware/upload'); // ใช้ตัวนี้ตัวเดียว

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', upload.single('image'), productController.createProduct);
router.put('/:id', upload.single('image'), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
