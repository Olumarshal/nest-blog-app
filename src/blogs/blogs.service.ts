import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Blog, BlogDocument } from './schemas/blog.schema';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogState } from './schemas/blog-state.enum'; // Import the BlogState enum

@Injectable()
export class BlogService {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>) {}

  // Utility function to calculate reading time based on word count
  private calculateReadingTime(text: string): number {
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = text.split(' ').length; // Split text by spaces to get word count
    const readingTime = Math.ceil(wordCount / wordsPerMinute); // Round up to the nearest minute
    return readingTime;
  }

  async create(createBlogDto: CreateBlogDto, userId: string): Promise<Blog> {
    // Calculate reading time for the blog content
    const readingTime = this.calculateReadingTime(createBlogDto.body);

    const newBlog = new this.blogModel({
      ...createBlogDto,
      author: userId,
      reading_time: readingTime,
    });
    return newBlog.save();
  }

  async getUserBlogs(
    userId: string,
    state?: BlogState,
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    // Log the userId before using it
    console.log('Fetching blogs for userId:', userId);

    // Validate userId as a valid ObjectId
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid userId provided');
    }
    const query = { author: new Types.ObjectId(userId) }; // Ensure userId is treated as ObjectId
    if (state) {
      query['state'] = state;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get the total count of documents
    const totalDocs = await this.blogModel.countDocuments(query).exec();

    // Fetch paginated results
    const blogs = await this.blogModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // Sorting by creation date, most recent first
      .exec();

    return {
      docs: blogs,
      totalDocs: totalDocs,
      totalPages: Math.ceil(totalDocs / limit),
      currentPage: page,
      hasNextPage: skip + limit < totalDocs,
      hasPrevPage: page > 1,
    };
  }

  async getPublishedBlogs(
    filterOptions: { author?: string; title?: string; tags?: string },
    sortOptions: { sortBy?: string; order?: 'asc' | 'desc' },
    paginationOptions: { page: number; limit: number },
  ): Promise<Blog[]> {
    const { author, title, tags } = filterOptions;
    const { sortBy, order } = sortOptions;
    const { page, limit } = paginationOptions;

    const query = { state: BlogState.Published };

    if (author) {
      query['author'] = author;
    }
    if (title) {
      query['title'] = new RegExp(title, 'i');
    }
    if (tags) {
      query['tags'] = { $in: tags.split(',') };
    }

    const sort = {};
    if (sortBy) {
      sort[sortBy] = order === 'asc' ? 1 : -1;
    } else {
      sort['timestamp'] = -1;
    }
    try {
      return this.blogModel
        .find(query)
        .populate('author', 'firstName lastName')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
    } catch (error) {
      throw new BadRequestException('Failed to retrieve blogs');
    }
  }

  async findById(id: string): Promise<Blog> {
    // Validate the provided ID as a valid ObjectId
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid Blog ID: ${id}`);
    }

    // Increment the read count and retrieve the blog with populated author information
    const blog = await this.blogModel
      .findByIdAndUpdate(
        id,
        { $inc: { read_count: 1 } }, // Increment the read_count field by 1
        { new: true }, // Return the updated document
      )
      .populate('author', 'firstName lastName'); // Populate author field excluding password

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    return blog;
  }

  async update(id: string, updateBlogDto: UpdateBlogDto): Promise<Blog> {
    const updatedBlog = await this.blogModel.findByIdAndUpdate(
      id,
      updateBlogDto,
      { new: true },
    );
    if (!updatedBlog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }
    return updatedBlog;
  }

  async publishBlog(blogId: string, userId: string): Promise<Blog> {
    const blog = await this.blogModel.findById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    if (blog.author.toString() !== userId) {
      throw new ForbiddenException('You are not allowed to publish this blog');
    }

    blog.state = BlogState.Published; // Use the BlogState enum value here
    return blog.save();
  }

  async delete(id: string): Promise<void> {
    const result = await this.blogModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }
  }
}
