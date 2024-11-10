import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { BooksService } from './books.service';
import { CreateBookDto } from './dtos/create-book.dto';
import { UpdateBookDto } from './dtos/update-book.dto';

@Controller('books')
@UseGuards(AuthenticationGuard)
export class BooksController {
    constructor(
        private readonly booksService: BooksService
    ) {}

  @Post()
  async createBook(@Res() res, @Body() createBookDto: CreateBookDto) {
    return this.booksService.createBook(createBookDto);
  }

  @Get()
  async getBooks() {
    return this.booksService.getBooks();
  }

  @Get(':id')
  async getBook(@Param('id') id: string) {
    return this.booksService.getBook(id);
  }

  @Patch(':id')
  async updateBook(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
  ) {
    return this.booksService.updateBook(id, updateBookDto);
  }

  @Delete(':id')
  async deleteNote(@Param('id') id: string) {
    return this.booksService.deleteBook(id);
  }
}
