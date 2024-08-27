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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';

@Controller('api/v1/blogs')
@ApiTags('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new blog post' })
  @ApiResponse({
    status: 201,
    description: 'The blog post has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or validation failed.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
  async create(@Request() req, @Body() createBlogDto: CreateBlogDto) {
    const userId = req.user.userId;
    return this.blogService.create(createBlogDto, userId);
  }

  @Get('userblogs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get a list of all blogs created by the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user blogs.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
  @ApiQuery({
    name: 'state',
    required: false,
    description:
      'The state of the blogs to filter by (e.g., Published, Draft).',
    enum: BlogState,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'The page number for pagination.',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'The number of blogs to retrieve per page.',
    example: 10,
  })
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
  @ApiOperation({ summary: 'Get a list of all published blogs' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved published blogs.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters.',
  })
  @ApiQuery({
    name: 'author',
    required: false,
    description: 'Filter blogs by author.',
    example: 'John Doe',
  })
  @ApiQuery({
    name: 'title',
    required: false,
    description: 'Filter blogs by title.',
    example: 'My First Blog',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    description:
      'Filter blogs by tags. Multiple tags can be separated by commas.',
    example: 'tech,science',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort the blogs by.',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    description:
      'Sort order, either "asc" for ascending or "desc" for descending.',
    example: 'desc',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'The page number for pagination.',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'The number of blogs to retrieve per page.',
    example: 20,
  })
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

  @Get('published/:id')
  @ApiOperation({ summary: 'Get a published blog by its ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved the published blog.',
  })
  @ApiResponse({
    status: 404,
    description: 'Blog not found or not published.',
  })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Publish a blog post' })
  @ApiResponse({
    status: 200,
    description: 'The blog post has been successfully published.',
  })
  @ApiResponse({
    status: 404,
    description: 'Blog not found.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access or not the blog owner.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update an existing blog post' })
  @ApiResponse({
    status: 200,
    description: 'The blog post has been successfully updated.',
  })
  @ApiResponse({
    status: 404,
    description: 'Blog not found.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update data or validation failed.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a blog post' })
  @ApiResponse({
    status: 200,
    description: 'The blog post has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Blog not found.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to delete blog due to bad request.',
  })
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
