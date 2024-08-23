import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BlogService } from './blogs.service';
import { Blog } from './schemas/blog.schema';
import { Model } from 'mongoose';

describe('BlogService', () => {
  let service: BlogService;
  let model: Model<Blog>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        {
          provide: getModelToken(Blog.name),
          // useValue: Model,
          useValue: {
            Model,
            findById: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BlogService>(BlogService);
    model = module.get<Model<Blog>>(getModelToken(Blog.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new blog', async () => {
    const blogDto = {
      title: 'Test',
      description: 'Test',
      author: 'Author',
      body: 'Test Body',
    };
    const createdBlog = { ...blogDto, _id: '1' };
    jest.spyOn(model, 'save').mockImplementationOnce(() => createdBlog as any);

    expect(await service.create(blogDto)).toEqual(createdBlog);
  });

  it('should publish a blog', async () => {
    const blog = { _id: '1', author: 'user1', state: 'draft', save: jest.fn() };
    jest.spyOn(model, 'findById').mockResolvedValue(blog as any);

    const result = await service.publishBlog('1', 'user1');
    expect(result.state).toBe('published');
    expect(blog.save).toHaveBeenCalled();
  });

  it('should get user blogs filtered by state', async () => {
    const blogs = [
      { _id: '1', state: 'draft' },
      { _id: '2', state: 'published' },
    ];
    jest.spyOn(model, 'find').mockResolvedValue(blogs as any);

    const result = await service.getUserBlogs('user1', 'draft');
    expect(result.length).toBe(1);
    expect(result[0].state).toBe('draft');
  });

  it('should update a blog', async () => {
    const updateBlogDto = { title: 'Updated Title' };
    const updatedBlog = {
      ...updateBlogDto,
      _id: '1',
      description: 'Test',
      author: 'Author',
      body: 'Test Body',
    };
    jest
      .spyOn(model, 'findByIdAndUpdate')
      .mockResolvedValueOnce(updatedBlog as any);

    expect(await service.update('1', updateBlogDto)).toEqual(updatedBlog);
  });

  it('should delete a blog', async () => {
    const result = { _id: '1' };
    jest.spyOn(model, 'findByIdAndDelete').mockResolvedValueOnce(result as any);

    await service.delete('1');
    expect(model.findByIdAndDelete).toHaveBeenCalledWith('1');
  });
});
