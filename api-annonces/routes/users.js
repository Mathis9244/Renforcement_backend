const express = require('express');
const router = express.Router();
const { validateUsername } = require('../middlewares/users');
const { requireRoles } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');
const {
    getAllUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser
} = require('../services/users');

router.get('/', getAllUsers);
router.get('/:id', getUser);

router.post('/', requireRoles(ROLES.ADMIN), validateUsername, createUser);
router.put('/:id', requireRoles(ROLES.ADMIN), updateUser);
router.delete('/:id', requireRoles(ROLES.ADMIN), deleteUser);

module.exports = router;
