import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Get,
  UseGuards,
  Query,
  Request,
  NotFoundException,
  BadRequestException,
  HttpStatus,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { BlogService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { JwtAuthGuard } from 'src/auth/jwt-guard';
import { BlogState } from './schemas/blog-state.enum';

@Controller('api/v1/blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Body() createBlogDto: CreateBlogDto) {
    const userId = req.user.userId;
    return this.blogService.create(createBlogDto, userId);
  }

  @Get('userblogs')
  @UseGuards(JwtAuthGuard)
  async getUserBlogs(
    @Request() req,
    @Query('state') state?: BlogState,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const userId = req.user.userId;
      const result = await this.blogService.getUserBlogs(
        userId,
        state,
        page,
        limit,
      );

      return {
        message: 'User blogs retrieved successfully',
        data: result.docs,
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to retrieve user blogs',
        error: error.message,
      };
    }
  }

  @Get('published')
  async getPublishedBlogs(
    @Query('author') author?: string,
    @Query('title') title?: string,
    @Query('tags') tags?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order: 'asc' | 'desc' = 'desc',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    try {
      const filterOptions = { author, title, tags };
      const sortOptions = { sortBy, order };
      const paginationOptions = { page, limit };

      const blogs = await this.blogService.getPublishedBlogs(
        filterOptions,
        sortOptions,
        paginationOptions,
      );
      return {
        message: 'Published blogs retrieved successfully',
        data: blogs,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to retrieve published blogs',
        error: error.message,
      };
    }
  }
  // Add proper status codes
  @Get('published/:id')
  async getPublishedBlogById(@Param('id') id: string) {
    try {
      const blog = await this.blogService.findById(id);
      if (blog.state !== BlogState.Published) {
        return {
          message: 'Blog is not published',
        };
      }
      return {
        message: 'Published blog retrieved successfully',
        data: blog,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to retrieve blog',
        error: error.message,
      };
    }
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  async publishBlog(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    try {
      const result = await this.blogService.publishBlog(id, userId);
      return {
        message: 'Blog published successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Blog with ID ${id} not found`);
      } else if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(
          'You are not authorized to publish this blog',
        );
      } else {
        throw new HttpException(
          'Failed to publish blog',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateBlogDto: UpdateBlogDto,
  ) {
    try {
      const updatedBlog = await this.blogService.update(id, updateBlogDto);
      return {
        message: 'Blog updated successfully',
        data: updatedBlog,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Blog with ID ${id} not found`);
      }
      throw new BadRequestException('Failed to update blog');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    try {
      await this.blogService.delete(id);
      return {
        message: 'Blog deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Blog with ID ${id} not found`);
      }
      throw new BadRequestException('Failed to delete blog');
    }
  }
}
