import express from "express"
import CartModel from "./schema.js"
import BookModel from "../books/schema.js"
import createHttpError from "http-errors"

const cartsRouter = express.Router()

cartsRouter.post("/:ownerId/addToCart", async (req, res, next) => {
  try {
    // We are going to receive bookId and quantity in req.body

    // 1. Find book in books collection by bookId

    const { bookId, quantity } = req.body

    const purchasedBook = await BookModel.findById(bookId)

    if (purchasedBook) {
      // 2. Is the product already in the active cart of the specified ownerId?

      const isBookThere = await CartModel.findOne({ ownerId: req.params.ownerId, status: "active", "products.asin": purchasedBook.asin })

      if (isBookThere) {
        // 3. If product is already there --> increase previous quantity
        const cart = await CartModel.findOneAndUpdate(
          { ownerId: req.params.ownerId, status: "active", "products.asin": purchasedBook.asin }, // WHO. If we target not only the owner and the status but also the specific product (which is an element of products array), mongo is going to store the index of that element into a variable called "positional operator" --> $
          {
            $inc: { "products.$.quantity": quantity }, // products[index].quantity += quantity
          }, // HOW we want to modify? By increasing the quantity of the product
          {
            new: true,
          }
        )
        res.send(cart)
      } else {
        // 4. If product is not there --> add it to cart
        const bookToInsert = { ...purchasedBook.toObject(), quantity }

        const cart = await CartModel.findOneAndUpdate(
          { ownerId: req.params.ownerId, status: "active" },
          {
            $push: { products: bookToInsert },
          },
          {
            new: true,
            upsert: true, // if the "active" cart is not found --> just create it automagically
          }
        )

        res.send(cart)
      }
    } else {
      next(createHttpError(404, `Book with id ${bookId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

export default cartsRouter
