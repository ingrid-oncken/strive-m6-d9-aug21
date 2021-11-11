import mongoose from "mongoose"

const { Schema, model } = mongoose

const userSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    dateOfBirth: { type: Date },
    age: { type: Number, min: 18, max: 65, required: true },
    professions: [String],
    purchaseHistory: [
      {
        asin: { type: String },
        title: { type: String },
        price: { type: Number },
        category: { type: String },
        purchaseDate: { type: Date },
      },
    ],
  },
  {
    timestamps: true, // adds and manage createdAt and updatedAt fields
  }
)

export default model("User", userSchema) // linked to the "users" collection, if the collection is not there it will be automagically created
