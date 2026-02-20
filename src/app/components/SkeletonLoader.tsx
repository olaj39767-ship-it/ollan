import React from 'react';

const SkeletonLoader = () => {
  return (
    <div className="animate-pulse">
      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 p-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Product Image Skeleton */}
            <div className="relative">
              <div className="w-full h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite]"></div>
              {/* Favorite Icon Skeleton */}
              <div className="absolute top-3 right-3 w-6 h-6 bg-gray-300 rounded-full"></div>
            </div>
            
            {/* Product Details Skeleton */}
            <div className="p-4 space-y-3">
              {/* Brand/Category */}
              <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-1/3"></div>
              
              {/* Product Title */}
              <div className="space-y-2">
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-full"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-3/4"></div>
              </div>
              
              {/* Rating Stars */}
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-gray-300 rounded-sm"></div>
                ))}
                <div className="h-3 bg-gray-300 rounded w-8 ml-2"></div>
              </div>
              
              {/* Price */}
              <div className="flex items-center space-x-2">
                <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-16"></div>
                <div className="h-4 bg-gray-300 rounded w-12"></div>
              </div>
              
              {/* Add to Cart Button */}
              <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded-md w-full"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Category Filter Skeleton */}
      <div className="px-6 mb-8">
        <div className="flex flex-wrap gap-2">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded-full px-4 py-2" style={{width: `${Math.random() * 60 + 80}px`}}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Add custom shimmer animation styles
const styles = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const StyleSheet = () => (
  <style dangerouslySetInnerHTML={{ __html: styles }} />
);

export default function App() {
  const [loading, setLoading] = React.useState(true);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <StyleSheet />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">            </div>
           
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className=" mx-auto py-8">
        {loading ? (
          <SkeletonLoader />
        ) : (
          <div className="px-6">
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Products Loaded!</h2>
              <p className="text-gray-600">Click "Show Skeleton" to see the loader again</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}