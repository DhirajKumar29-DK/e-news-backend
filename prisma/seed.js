import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Seed Admin User
  const adminEmail = 'admin@enews.com';
  const hashedPassword = await bcrypt.hash('Admin@123456', 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: 'ADMIN'
    },
    create: {
      name: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log('✅ Admin User Ready:');
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Password: Admin@123456`);

  // 2. Seed Initial Editions (Cities)
  const editions = [
    {
      name: 'Patna Main (अपना पटना)',
      city: 'Patna',
      slug: 'patna-main',
      code: 'PAT_MAIN',
      isActive: true
    },
    {
      name: 'Delhi NCR (दिल्ली NCR)',
      city: 'Delhi',
      slug: 'delhi-ncr',
      code: 'DEL_NCR',
      isActive: true
    },
    {
      name: 'Ranchi Metro (रांची)',
      city: 'Ranchi',
      slug: 'ranchi-metro',
      code: 'RAN_METRO',
      isActive: true
    }
  ];

  for (const ed of editions) {
    await prisma.edition.upsert({
      where: { slug: ed.slug },
      update: { name: ed.name, city: ed.city, code: ed.code, isActive: ed.isActive },
      create: ed
    });
  }

  console.log('✅ Initial Editions (Cities) Seeded Successfully!');

  // 3. Seed Sample E-News Articles
  const articles = [
    {
      title: 'बिहार में नई बुनियादी ढांचा परियोजनाओं को मंजूरी मिली',
      slug: 'bihar-infrastructure-projects-approved',
      summary: 'राज्य सरकार ने राज्य भर में सड़क और पुल विकास के लिए नए बजट को मंजूरी दी है।',
      content: 'बिहार राज्य कैबिनेट ने विभिन्न जिलों में कनेक्टिविटी में सुधार के लिए ₹2,500 करोड़ से अधिक की नई बुनियादी ढांचा परियोजनाओं को हरी झंडी दे दी है...',
      category: 'National',
      status: 'PUBLISHED',
      coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7'
    },
    {
      title: 'पटना मेट्रो निर्माण कार्य में तेजी आई',
      slug: 'patna-metro-construction-speed-up',
      summary: 'प्रस्तावित मेट्रो लाइन के पहले चरण का परीक्षण अगले वर्ष शुरू होने की उम्मीद है।',
      content: 'पटना मेट्रो रेल परियोजना पर काम तेजी से आगे बढ़ रहा है और अधिकारियों ने पुष्टि की है कि एलिवेटेड कॉरिडोर का निर्माण अंतिम चरण में है...',
      category: 'Local News',
      status: 'PUBLISHED',
      coverImage: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0'
    }
  ];

  for (const art of articles) {
    await prisma.article.upsert({
      where: { slug: art.slug },
      update: { title: art.title, content: art.content, summary: art.summary, category: art.category },
      create: art
    });
  }

  console.log('✅ Sample E-News Articles Seeded Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
