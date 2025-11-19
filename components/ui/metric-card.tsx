import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  isLoading?: boolean;
  showProgress?: boolean;
  progressValue?: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 }
  }
};

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  bgColor,
  isLoading = false,
  showProgress = false,
  progressValue = 0,
  trend
}: MetricCardProps) {
  return (
    <motion.div variants={cardVariants}>
      <Card className="relative overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 border-white/20 bg-white/70 backdrop-blur-sm group">
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${bgColor} opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />
        
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${color} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        
        <CardContent className="relative">
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {value}
              {trend && (
                <span className={`text-sm ml-2 ${trend.isPositive ? 'text-[#28F16B]' : 'text-[#F52E60]'}`}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
          )}
          
          {showProgress && !isLoading && (
            <div className="mt-3">
              <Progress 
                value={progressValue} 
                className="h-2 bg-gray-200"
              />
            </div>
          )}
          
          <p className="text-xs text-gray-600 mt-1">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
} 