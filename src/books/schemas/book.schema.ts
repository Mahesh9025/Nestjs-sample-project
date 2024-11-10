import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema()
export class Book extends Document {
  @Prop({ required: true, minlength: 2, maxlength: 100 })
  title: string;

  @Prop({ required: true, minlength: 10 })
  description: string;

  
}

export const BookSchema = SchemaFactory.createForClass(Book);