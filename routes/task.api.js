const express = require("express")
const taskController = require("../controllers/task.controller")
const authController = require("../controllers/auth.controller")
const router = express.Router()


router.post('/', authController.authenticate , taskController.createTask)

// router.post('/',(req,res)=>{
//     res.send("create tasks")
// })

router.get('/',taskController.getTask)

// router.get('/',(req,res)=>{
//     res.send("get tasks")
// })

router.put('/:id',taskController.updateTask)
// router.put('/:id',(req,res)=>{
//     res.send("Update task")
// })

router.delete('/:id',taskController.deleteTask)
// router.delete('/:id',(req,res)=>{
//     res.send("delete task")
// })

module.exports = router