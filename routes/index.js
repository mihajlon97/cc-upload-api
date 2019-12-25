const MainController = require('../controllers/main.controller');

module.exports = function (express) {
	const router = express.Router();

	// ----------- Routes -------------
	router.post('/upload',           MainController.upload);
	router.get('/list',              MainController.list);
	router.post('/complete/:id',     MainController.complete);

	return router;
};
