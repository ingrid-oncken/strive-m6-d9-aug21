import mongoose from "mongoose"

const { Schema, model } = mongoose

const bookSchema = new Schema(
  {
    asin: { type: String, required: true },
    title: { type: String, required: true },
    img: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true, enum: ["horror", "fantasy", "history", "romance"] },
    authors: [{ type: Schema.Types.ObjectId, ref: "Author" }],
  },
  { timestamps: true }
)

bookSchema.static("findBookWithAuthors", async function (query) {
  // <-- CANNOT BE ARROW FUNCTION
  // Needs to be a normal function because of "this" keyword. If we use normal function, "this" will refer to BookModel
  const total = await this.countDocuments(query)
  const books = await this.find(query.criteria)
    .limit(query.options.limit)
    .skip(query.options.skip)
    .sort(query.options.sort)
    .populate({ path: "authors", select: "firstName lastName" }) // this is going to "join" authors with books by searching for all the references into the authors collection

  return { total, books }
})

export default model("Book", bookSchema)

// USAGE --> BookModel.findBookWithAuthors(mongoQuery)
