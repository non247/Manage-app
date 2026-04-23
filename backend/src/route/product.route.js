const express = require('express');
const router = express.Router();

const productController = require('../controller/product.controller');
const upload = require('../middleware/upload');

console.log('productController keys =', Object.keys(productController));
console.log('getAllProducts =', typeof productController.getAllProducts);
console.log('getProductById =', typeof productController.getProductById);
console.log('createProduct =', typeof productController.createProduct);
console.log('updateProduct =', typeof productController.updateProduct);
console.log('deleteProduct =', typeof productController.deleteProduct);

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', upload.single('image'), productController.createProduct);
router.put('/:id', upload.single('image'), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;