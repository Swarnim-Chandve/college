# GHRCE Portal Design

## Latest Features (v3)

### 🆕 **1-Year Internship Duration**
- Added support for 1-year internship applications
- Complete integration across all components
- Database table: `joining_1y`
- Server actions: `createJoining1y`, `listJoining1y`, `approveJoining1y`, `rejectJoining1y`

### 📊 **Enhanced Reports Dashboard**
- **Comprehensive Statistics**: Total, Pending, Approved, Rejected counts
- **Duration Breakdown**: 2 Weeks, 4 Weeks, 6 Months, 1 Year
- **Branch Analysis**: Count by department/branch
- **Filter Tracking**: Shows active filters and result counts
- **Clear Filters**: One-click reset functionality

### 🎨 **UI/UX Improvements**
- **Larger Fonts**: `text-4xl font-black` for better visibility
- **Color-Coded Statistics**: Visual distinction for different metrics
- **Responsive Design**: Works on all screen sizes
- **Professional Dashboard**: Modern, clean interface

### 🔧 **Technical Enhancements**
- **Type Safety**: Updated `InternshipDuration` type to include `"1y"`
- **Database Schema**: New `Joining1y` model with full feature parity
- **Server Actions**: Complete CRUD operations for 1-year duration
- **Navigation**: Updated student sidebar with 1-year option

## 🚀 **Getting Started**

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/Swarnim-Chandve/college.git
cd college

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL

# Run database migrations
npx prisma db push

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

### Database Setup
```bash
# Push schema changes
npx prisma db push

# Seed database with sample data
npx prisma db seed
```

## 📋 **Features**

### Student Features
- **Dashboard**: View profile and application status
- **Internship Applications**: Apply for 2w, 4w, 6m, or 1y internships
- **Application Tracking**: Real-time status updates
- **Certificate Upload**: PDF certificate submission

### Faculty Features
- **Student Management**: View registered students
- **Application Approvals**: Multi-level approval workflow
- **Reports Dashboard**: Comprehensive analytics and statistics
- **Filtering**: Advanced filtering by duration, status, branch, etc.

### Admin Features
- **Database Seeding**: Initialize with sample data
- **User Management**: Manage faculty and student accounts
- **System Configuration**: Admin tools and utilities

## 🏗️ **Architecture**

### Tech Stack
- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom session management
- **Deployment**: Vercel-ready

### Project Structure
```
college/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── faculty/           # Faculty dashboard
│   ├── student/           # Student portal
│   └── ...
├── components/            # Reusable UI components
├── lib/                   # Utility functions
├── prisma/                # Database schema and migrations
└── public/                # Static assets
```

## 🔄 **Recent Updates**

### v3.0.0 (Latest)
- ✅ Added 1-year internship duration support
- ✅ Enhanced reports dashboard with statistics
- ✅ Improved UI with larger, bolder fonts
- ✅ Added branch-wise analytics
- ✅ Enhanced filter functionality
- ✅ Updated student navigation

### Previous Versions
- v2: Enhanced approval workflow
- v1: Initial implementation

## 🐛 **Known Issues**
- None currently reported

## 🤝 **Contributing**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**
This project is licensed under the MIT License.

## 👥 **Team**
- **Developer**: Swarnim Chandve
- **Institution**: GHRCE (G.H. Raisoni College of Engineering)

---

# Latest deployment trigger
# Credentials fixed - all users now have password123
