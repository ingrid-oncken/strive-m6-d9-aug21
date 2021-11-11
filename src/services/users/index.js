import express from "express"
import createHttpError from "http-errors"

import UserModel from "./schema.js"
import BookModel from "../books/schema.js"

const usersRouter = express.Router()

usersRouter.post("/", async (req, res, next) => {
  try {
    const newUser = new UserModel(req.body) // here happens validation of req.body, if it is not ok Mongoose will throw a "ValidationError" (btw user is still not saved in db yet)
    const { _id } = await newUser.save() // this is the line in which the interaction with the db happens
    res.status(201).send({ _id })
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/", async (req, res, next) => {
  try {
    const users = await UserModel.find()
    res.send(users)
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/:userId", async (req, res, next) => {
  try {
    const id = req.params.userId

    const user = await UserModel.findById(id)
    if (user) {
      res.send(user)
    } else {
      next(createHttpError(404, `User with id ${id} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.put("/:userId", async (req, res, next) => {
  try {
    const id = req.params.userId
    const updatedUser = await UserModel.findByIdAndUpdate(id, req.body, { new: true })

    if (updatedUser) {
      res.send(updatedUser)
    } else {
      next(createHttpError(404, `User with id ${id} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.delete("/:userId", async (req, res, next) => {
  try {
    const id = req.params.userId

    const deletedUser = await UserModel.findByIdAndDelete(id)
    if (deletedUser) {
      res.status(204).send()
    } else {
      next(createHttpError(404, `User with id ${id} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.post("/:userId/purchaseHistory", async (req, res, next) => {
  try {
    // We are receiving the bookId in the req.body. Given that id we want to insert the corresponding book's data into the purchase history of that user (specified by :userId)

    // 1. Find the book in the books collection by id
    const purchasedBook = await BookModel.findById(req.body.bookId, { _id: 0 }) // findById(query, projection), with the usage of projection we could remove the id from the returned book --> when I'm adding the book to the purchaseHistory array, mongo will create a brand new unique id for that book

    if (purchasedBook) {
      // 2. If the book is found, let's add additional info like purchaseDate
      const bookToInsert = { ...purchasedBook.toObject(), purchaseDate: new Date() } // purchasedBook is a MONGOOSE DOCUMENT (special object with a lot of strange fields), it is NOT a NORMAL OBJECT, therefore if I want to spread it I need to convert it into a plain object
      console.log(bookToInsert)
      // 3. Update the specified user by adding the book to the history

      const updatedUser = await UserModel.findByIdAndUpdate(
        req.params.userId, // WHO we want to modify
        { $push: { purchaseHistory: bookToInsert } }, // HOW we want to modify the specified user
        { new: true } // OPTIONS
      )
      if (updatedUser) {
        res.send(updatedUser)
      } else {
        next(createHttpError(404, `User with id ${req.params.userId} not found!`))
      }
    } else {
      next(createHttpError(404, `Book with id ${req.body.bookId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/:userId/purchaseHistory", async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.userId)
    if (user) {
      res.send(user.purchaseHistory)
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/:userId/purchaseHistory/:productId", async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.userId)
    if (user) {
      const purchasedItem = user.purchaseHistory.find(book => book._id.toString() === req.params.productId) // You CANNOT compare an ObjectId (book._id) with a string (req.params.productId) --> _id needs to be converted into a string
      if (purchasedItem) {
        res.send(purchasedItem)
      } else {
        next(createHttpError(404, `Book with id ${req.params.productId} not found!`))
      }
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.put("/:userId/purchaseHistory/:productId", async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.userId) // user is a MONGOOSE DOCUMENT, it is not a PLAIN JS OBJECT

    if (user) {
      const index = user.purchaseHistory.findIndex(p => p._id.toString() === req.params.productId)

      if (index !== -1) {
        user.purchaseHistory[index] = { ...user.purchaseHistory[index].toObject(), ...req.body }
        await user.save()
        res.send(user)
      } else {
        next(createHttpError(404, `Book with id ${req.params.productId} not found!`))
      }
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found!`))
    }

    // const user = await UserModel.findOneAndUpdate(
    //   { _id: req.params.userId, "purchaseHistory._id": req.params.productId },
    //   {
    //     "purchaseHistory.$": req.body, // purchaseHistory[index] in js is equal to purchaseHistory.$ in mongo, N.B. req.body should contain all the properties of the product
    //   }
    // )
  } catch (error) {
    next(error)
  }
})

usersRouter.delete("/:userId/purchaseHistory/:productId", async (req, res, next) => {
  try {
    const modifiedUser = await UserModel.findByIdAndUpdate(
      req.params.userId, // WHO
      { $pull: { purchaseHistory: { _id: req.params.productId } } }, // HOW we want to modify the user (remove a specified item from the purchaseHistory array)
      { new: true } // OPTIONS
    )
    if (modifiedUser) {
      res.send(modifiedUser)
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

export default usersRouter
