const OrderService = require('../services/orderService');

exports.createOrder = async (req, res, next) => {
  try {
    const order = await OrderService.create(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Bon de commande créé avec succès',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await OrderService.findAll(req.query);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await OrderService.findById(req.params.id);
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// Modification complète (réception / expédition)
exports.modifyOrder = async (req, res, next) => {
  try {
    const { commentaire, ...data } = req.body;
    const order = await OrderService.modify(
      req.params.id,
      data,
      req.user,
      commentaire
    );
    res.json({
      success: true,
      message: 'Bon de commande modifié avec succès',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// Corrections ciblées (compat)
exports.verifyOrder = async (req, res, next) => {
  try {
    const { corrections = [], commentaire } = req.body;
    const order = await OrderService.verifyAndCorrect(
      req.params.id,
      corrections,
      req.user,
      commentaire
    );
    res.json({
      success: true,
      message: 'Commande vérifiée et corrigée avec succès',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

exports.confirmOrder = async (req, res, next) => {
  try {
    const { commentaire } = req.body;
    const order = await OrderService.confirm(req.params.id, req.user, commentaire);
    res.json({
      success: true,
      message: 'Bon de commande confirmé avec succès',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

exports.receiveOrder = async (req, res, next) => {
  try {
    const { products, commentaire } = req.body;
    const order = await OrderService.receive(
      req.params.id,
      products,
      req.user,
      commentaire
    );
    res.json({
      success: true,
      message: 'Commande réceptionnée avec succès',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

exports.expediteOrder = async (req, res, next) => {
  try {
    const { commentaire } = req.body;
    const order = await OrderService.expedite(req.params.id, req.user, commentaire);
    res.json({
      success: true,
      message: 'Commande expédiée avec succès',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const { commentaire } = req.body;
    const order = await OrderService.cancel(req.params.id, req.user, commentaire);
    res.json({
      success: true,
      message: 'Bon de commande supprimé',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action, userId } = req.query;

    if (action) {
      const history = await OrderService.getHistoryByAction(req.params.id, action);
      return res.json({ success: true, data: history });
    }

    if (userId) {
      const history = await OrderService.getHistoryByUser(req.params.id, userId);
      return res.json({ success: true, data: history });
    }

    const history = await OrderService.getHistory(
      req.params.id,
      Number(page),
      Number(limit)
    );
    if (!history) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderHistory = async (req, res, next) => {
  try {
    const order = await OrderService.updateHistoryEntry(
      req.params.id,
      req.params.historyId,
      req.body,
      req.user
    );
    res.json({
      success: true,
      message: 'Historique mis à jour avec succès',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

exports.getGlobalOrderHistory = async (req, res, next) => {
  try {
    const history = await OrderService.getGlobalHistory(req.query);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

exports.exportOrderHistory = async (req, res, next) => {
  try {
    const csv = await OrderService.exportHistory(req.params.id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="historique-${req.params.id}.csv"`
    );
    res.send(csv);
  } catch (error) {
    next(error);
  }
};
