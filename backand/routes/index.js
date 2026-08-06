const express = require('express');
const router = express.Router();


const { auth, admin, productManage, orderCreate, orderConfirmModify, reception, expedition, superAdmin } = require('../middlewares/auth');


const user = require('../controllers/userController');
const order = require('../controllers/orderController');
const product = require('../controllers/productController');
const supplier = require('../controllers/supplierController');
const category = require('../controllers/categoryController');
const report = require('../controllers/reportController');
const dashboard = require('../controllers/dashboardController');
const print = require('../controllers/printController');
const search = require('../controllers/searchController');
const company = require('../controllers/companyController');


router.post('/auth/register', auth, superAdmin, user.register);
router.post('/auth/login', user.login);
router.get('/profile', auth, user.getProfile);
router.put('/profile', auth, user.updateProfile);
router.put('/profile/password', auth, user.changePassword);


router.get('/users', auth, superAdmin, user.getUsers);
router.get('/users/:id', auth, superAdmin, user.getUserById);
router.put('/users/:id', auth, superAdmin, user.updateUser);
router.post('/users', auth, superAdmin, user.createUser);
router.delete('/users/:id', auth, superAdmin, user.deleteUser);


router.get('/orders/history', auth, order.getGlobalOrderHistory);

router.get('/orders', auth, order.getOrders);
router.get('/orders/:id', auth, order.getOrderById);
router.get('/orders/:id/history', auth, order.getOrderHistory);
router.get('/orders/:id/history/export', auth, order.exportOrderHistory);
router.put('/orders/:id/history/:historyId', auth, orderConfirmModify, order.updateOrderHistory);


router.post('/orders', auth, orderCreate, order.createOrder);


router.put('/orders/:id', auth, orderConfirmModify, order.modifyOrder);
router.put('/orders/:id/verify', auth, orderConfirmModify, order.verifyOrder);
router.put('/orders/:id/confirm', auth, orderConfirmModify, order.confirmOrder);


router.put('/orders/:id/receive', auth, reception, order.receiveOrder);
router.put('/orders/:id/expedite', auth, expedition, order.expediteOrder);
router.delete('/orders/:id', auth, admin, order.deleteOrder);


router.get('/products', auth, product.getProducts);
router.get('/products/search', auth, product.searchProducts);
router.get('/products/low-stock', auth, product.getLowStockProducts);
router.get('/products/:id', auth, product.getProductById);
router.post('/products', auth, productManage, product.createProduct);
router.put('/products/:id', auth, productManage, product.updateProduct);
router.patch('/products/:id/stock', auth, productManage, product.updateStock);
router.delete('/products/:id', auth, productManage, product.deleteProduct);


router.get('/suppliers', auth, supplier.getSuppliers);
router.get('/suppliers/:id', auth, supplier.getSupplierById);
router.post('/suppliers', auth, admin, supplier.createSupplier);
router.put('/suppliers/:id', auth, admin, supplier.updateSupplier);
router.delete('/suppliers/:id', auth, admin, supplier.deleteSupplier);


router.get('/company', auth, company.getActiveCompany);
router.put('/company', auth, superAdmin, company.updateActiveCompany);
router.post('/company/logo', auth, superAdmin, company.uploadLogoMiddleware, company.uploadActiveLogo);

router.get('/companies', auth, superAdmin, company.getCompanies);
router.get('/companies/:id', auth, superAdmin, company.getCompanyById);
router.post('/companies', auth, superAdmin, company.createCompany);
router.put('/companies/:id', auth, superAdmin, company.updateCompany);
router.post('/companies/:id/logo', auth, superAdmin, company.uploadLogoMiddleware, company.uploadCompanyLogo);
router.delete('/companies/:id', auth, superAdmin, company.deleteCompany);


router.get('/categories', auth, category.getCategories);
router.get('/categories/:id', auth, category.getCategoryById);
router.post('/categories', auth, admin, category.createCategory);
router.put('/categories/:id', auth, admin, category.updateCategory);
router.delete('/categories/:id', auth, admin, category.deleteCategory);


router.get('/dashboard', auth, dashboard.getDashboard);
router.get('/dashboard/stats', auth, dashboard.getStats);
router.get('/reports/orders', auth, admin, report.getOrderReport);
router.get('/reports/stock', auth, admin, report.getStockReport);
router.get('/reports/suppliers', auth, admin, report.getSupplierReport);
router.get('/reports/users', auth, superAdmin, report.getUserReport);


router.get('/print-settings', auth, print.getSettings);
router.put('/print-settings', auth, admin, print.updateSettings);
router.post(
  '/print-settings/logo',
  auth,
  admin,
  print.uploadLogoMiddleware,
  print.uploadCompanyLogo
);
router.get('/orders/:id/print', auth, print.printOrder);
router.get('/orders/:id/download', auth, print.downloadPDF);


router.get('/search', auth, search.globalSearch);
router.get('/health', (req, res) => res.json({ 
  success: true, 
  status: 'OK', 
  timestamp: new Date() 
}));


router.all('/{*splat}', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route non trouvée: ${req.method} ${req.originalUrl}` 
  });
});


module.exports = router;
