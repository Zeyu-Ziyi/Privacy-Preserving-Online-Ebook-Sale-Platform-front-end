  // src/api/booksApi.js

const mockBooks = [
  { id: 1, title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', year: 1954, price: 25.99, description: 'A timeless epic of good versus evil, set in the richly detailed world of Middle-earth. Follow Frodo Baggins as he undertakes a perilous journey to destroy the One Ring.', cover: 'https://via.placeholder.com/250x380.png?text=LOTR' },
  { id: 2, title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813, price: 15.50, description: 'A classic romance that sparkles with wit and explores the societal pressures of 19th-century England through the story of Elizabeth Bennet and Mr. Darcy.', cover: 'https://via.placeholder.com/250x380.png?text=P&P' },
  { id: 3, title: 'To Kill a Mockingbird', author: 'Harper Lee', year: 1960, price: 18.00, description: 'A profound story of racial injustice and the loss of innocence in the American South, told through the eyes of a young girl named Scout Finch.', cover: 'https://via.placeholder.com/250x380.png?text=Mockingbird' },
  { id: 4, title: '1984', author: 'George Orwell', year: 1949, price: 22.50, description: 'A dystopian masterpiece that paints a chilling vision of a totalitarian future where Big Brother is always watching and independent thought is a crime.', cover: 'https://via.placeholder.com/250x380.png?text=1984' },
  { id: 5, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', year: 1925, price: 19.99, description: 'A dazzling and decadent portrayal of the Jazz Age, exploring themes of wealth, love, and the elusive American Dream through the eyes of the mysterious millionaire Jay Gatsby.', cover: 'https://via.placeholder.com/250x380.png?text=Gatsby' },
  { id: 6, title: 'Moby Dick', author: 'Herman Melville', year: 1851, price: 21.00, description: 'The epic saga of Captain Ahab\'s obsessive quest for revenge on the giant white whale that took his leg, exploring themes of obsession, fate, and humanity.', cover: 'https://via.placeholder.com/250x380.png?text=Moby+Dick' },
  { id: 7, title: 'The Catcher in the Rye', author: 'J.D. Salinger', year: 1951, price: 16.99, description: 'A classic coming-of-age story following Holden Caulfield as he navigates the complexities of adolescence and society in post-war America.', cover: 'https://via.placeholder.com/250x380.png?text=Catcher' },
  { id: 8, title: 'Brave New World', author: 'Aldous Huxley', year: 1932, price: 20.50, description: 'A dystopian novel that explores a future society where happiness is manufactured through genetic engineering and psychological conditioning.', cover: 'https://via.placeholder.com/250x380.png?text=Brave+New' },
  { id: 9, title: 'The Hobbit', author: 'J.R.R. Tolkien', year: 1937, price: 23.99, description: 'A charming adventure story about Bilbo Baggins, a hobbit who embarks on an unexpected journey with thirteen dwarves to reclaim their homeland.', cover: 'https://via.placeholder.com/250x380.png?text=Hobbit' },
  { id: 10, title: 'Jane Eyre', author: 'Charlotte Brontë', year: 1847, price: 17.50, description: 'A gothic romance that tells the story of Jane Eyre, an orphan who becomes a governess and falls in love with her mysterious employer.', cover: 'https://via.placeholder.com/250x380.png?text=Jane+Eyre' },
  { id: 11, title: 'Animal Farm', author: 'George Orwell', year: 1945, price: 14.99, description: 'An allegorical novella that uses farm animals to satirize the events leading up to the Russian Revolution and the Stalinist era.', cover: 'https://via.placeholder.com/250x380.png?text=Animal+Farm' },
  { id: 12, title: 'The Alchemist', author: 'Paulo Coelho', year: 1988, price: 18.99, description: 'A philosophical novel about a young Andalusian shepherd who dreams of finding a worldly treasure and embarks on a journey of self-discovery.', cover: 'https://via.placeholder.com/250x380.png?text=Alchemist' },
  { id: 13, title: 'The Little Prince', author: 'Antoine de Saint-Exupéry', year: 1943, price: 12.99, description: 'A poetic tale about a young prince who visits various planets and learns about love, loss, and the meaning of life.', cover: 'https://via.placeholder.com/250x380.png?text=Little+Prince' },
  { id: 14, title: 'The Kite Runner', author: 'Khaled Hosseini', year: 2003, price: 19.99, description: 'A powerful story of friendship, betrayal, and redemption set against the backdrop of Afghanistan\'s turbulent history.', cover: 'https://via.placeholder.com/250x380.png?text=Kite+Runner' },
  { id: 15, title: 'The Book Thief', author: 'Markus Zusak', year: 2005, price: 21.50, description: 'A unique perspective on Nazi Germany told through the eyes of Death, following a young girl who steals books and shares them with others.', cover: 'https://via.placeholder.com/250x380.png?text=Book+Thief' },
];



// 新增: 根据ID获取单本书籍
export const fetchBookById = async (id) => {
  console.log(`Fetching book with id: ${id}`);
  await new Promise(resolve => setTimeout(resolve, 300)); // 模拟延迟
  const book = mockBooks.find(b => b.id === parseInt(id));
  if (!book) {
    throw new Error('Book not found');
  }
  return book;
};

// 修改 fetchBooks 函数以支持分页
export const fetchBooks = async ({ query, type = 'title', pageParam = 1 }) => {
  console.log(`Fetching page ${pageParam} for query: "${query}", type: "${type}"`);
  await new Promise(resolve => setTimeout(resolve, 500)); 

  const pageSize = 5; // 每页返回5本书

  // 筛选逻辑
  let filteredResults = mockBooks;
  if (query && query.trim()) { // 只有当存在非空搜索词时才进行筛选
    const lowercasedQuery = query.toLowerCase().trim();
    filteredResults = mockBooks.filter(book => {
      const title = book.title.toLowerCase();
      const author = book.author.toLowerCase();
      switch (type) {
        case 'title':
          return title.includes(lowercasedQuery);
        case 'author':
          return author.includes(lowercasedQuery);
        default:
          return true;
      }
    });
  }
  // 如果搜索词为空，返回所有书籍

  // 分页计算
  const start = (pageParam - 1) * pageSize;
  const end = start + pageSize;
  const paginatedItems = filteredResults.slice(start, end);

  // 返回TanStack Query infinite query期望的格式
  return {
    books: paginatedItems,
    // 如果还能有下一页，则返回下一页的页码；否则返回undefined
    nextPage: end < filteredResults.length ? pageParam + 1 : undefined,
  };
};