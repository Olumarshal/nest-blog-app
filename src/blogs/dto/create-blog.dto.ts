import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsNumber()
  reading_time?: number;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsString()
  @IsNotEmpty()
  body: string;
}
