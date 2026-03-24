const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('../models');
const { writeAuditLog } = require('../lib/audit');

const getAllUsers = async (req, res) => {
    try {
        const {
            usernameLike,
            emailLike,
            firstname,
            lastname,
            ids,
            idGte,
            idLte
        } = req.query;

        const where = {};

        if (usernameLike) {
            where.username = { [Op.like]: `%${usernameLike}%` };
        }
        if (emailLike) {
            where.email = { [Op.like]: `%${emailLike}%` };
        }
        if (firstname) {
            where.firstname = { [Op.eq]: firstname };
        }
        if (lastname) {
            where.lastname = { [Op.eq]: lastname };
        }
        if (ids) {
            const parsedIds = String(ids)
                .split(',')
                .map((value) => Number(value.trim()))
                .filter((value) => Number.isInteger(value));
            if (parsedIds.length > 0) {
                where.id = { ...(where.id || {}), [Op.in]: parsedIds };
            }
        }
        if (idGte) {
            const parsed = Number(idGte);
            if (Number.isInteger(parsed)) {
                where.id = { ...(where.id || {}), [Op.gte]: parsed };
            }
        }
        if (idLte) {
            const parsed = Number(idLte);
            if (Number.isInteger(parsed)) {
                where.id = { ...(where.id || {}), [Op.lte]: parsed };
            }
        }

        const users = await User.findAll({ where, order: [['id', 'ASC']] });
        return res.status(200).json({ users });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
}

const getUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ user });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch user', error: error.message });
    }
}

const createUser = async (req, res) => {
    try {
        const { password, username, email, firstname, lastname, role, isActive } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'username and password required' });
        }
        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            password: hash,
            email: email || null,
            firstname: firstname || null,
            lastname: lastname || null,
            role: role || 'charge_clientele',
            isActive: isActive !== false,
        });
        await writeAuditLog({
            entityType: 'User',
            entityId: user.id,
            action: 'USER_CREATED',
            userId: req.user.id,
        });
        return res.status(201).json({ user });
    } catch (error) {
        return res.status(400).json({ message: 'Failed to create user', error: error.message });
    }
}

const updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const patch = { ...req.body };
        if (patch.password) {
            patch.password = await bcrypt.hash(patch.password, 10);
        }
        await user.update(patch);
        await writeAuditLog({
            entityType: 'User',
            entityId: user.id,
            action: 'USER_UPDATED',
            userId: req.user.id,
        });
        return res.status(200).json({
            message: 'Successfuly updated',
            user
        });
    } catch (error) {
        return res.status(400).json({ message: 'Failed to update user', error: error.message });
    }
}

const deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await user.update({ isActive: false });
        await writeAuditLog({
            entityType: 'User',
            entityId: user.id,
            action: 'USER_DEACTIVATED',
            userId: req.user.id,
        });
        return res.status(200).json({
            message: 'User deactivated'
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to deactivate user', error: error.message });
    }
}

module.exports = {
    getAllUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser
}
