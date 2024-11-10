import { Injectable, NotFoundException } from '@nestjs/common';
import { Book } from './schemas/book.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateBookDto } from './dtos/create-book.dto';
import { UpdateBookDto } from './dtos/update-book.dto';

@Injectable()
export class BooksService {
    constructor(
        @InjectModel(Book.name) private booksModel: Model<Book>,
    ) {}

    async createBook(payload: CreateBookDto) {
        const createdBook = new this.booksModel(payload);
        const result = await createdBook.save();
        return {message: 'New book is created.', data:result};
      }
    
      async getBooks() {
        const books = await this.booksModel.find();
        return {message: 'Data retrieved successfully', data:books};
      }
    
      async getBook(id: string) {
        const book = await this.booksModel.findById(id);
        return {message: 'Data retrieved successfully', data: book};
      }
    
      async updateBook(id: string, payload: UpdateBookDto) {
        const updatedBook = await this.booksModel.findByIdAndUpdate(id, payload, {
          new: true,
        });
    
        if (!updatedBook) {
          throw new NotFoundException('Book not found');
        }
    
        return {message: 'Updated book successfully', data: updatedBook};
      }
    
      async deleteBook(id: string) {
        const deletedBook = await this.booksModel.deleteOne({_id: id});
        return {message: 'Deleted book successfully', data: deletedBook};;
      }
}
