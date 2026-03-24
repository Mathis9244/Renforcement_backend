
const getAllUsers = (req, res) => {
    res.status(200).json({
        users: []
    })
}

const getUser = (req, res) => {
    res.status(200).json({
        user: req.params.id
    })
}

const createUser = (req, res) => {
    const user = req.body;
    res.status(201).json({
        user
    })
}

const updateUser = (req, res) => {
    res.status(200).json({
        message: "Successfuly updated",
        user: req.body
    })
}

const deleteUser = (req, res) => {
    res.status(200).json({
        message: "Successfuly deleted"
    })
}

module.exports = {
    getAllUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser
}