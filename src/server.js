import express from "express"
import listEndpoints from "express-list-endpoints"
import mongoose from "mongoose"
import cors from "cors"
import { notFoundHandler, badRequestHandler, genericErrorHandler } from "./errorHandlers.js"

import usersRouter from "./services/users/index.js"
import booksRouter from "./services/books/index.js"
import authorsRouter from "./services/authors/index.js"
import cartsRouter from "./services/carts/index.js"

const server = express()

const port = process.env.PORT || 3001

// ********************************* MIDDLEWARES ***************************************

server.use(cors())
server.use(express.json())

// ********************************* ROUTES ********************************************

server.use("/users", usersRouter)
server.use("/books", booksRouter)
server.use("/authors", authorsRouter)
server.use("/carts", cartsRouter)

// ********************************* ERROR HANDLERS ************************************

server.use(notFoundHandler)
server.use(badRequestHandler)
server.use(genericErrorHandler)

mongoose.connect(process.env.MONGO_CONNECTION)

mongoose.connection.on("connected", () => {
  console.log("Mongo Connected!")

  server.listen(port, () => {
    console.table(listEndpoints(server))

    console.log(`Server running on port ${port}`)
  })
})

mongoose.connection.on("error", err => {
  console.log(err)
})
