'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Activity {
    id: string;
    message: string;
    time: string;
    type: 'success' | 'warning' | 'info';
}

interface RecentActivityProps {
    activities?: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
    const defaultActivities: Activity[] = [
        { id: '1', message: 'New shopkeeper registered', time: '1 hour ago', type: 'success' },
        { id: '2', message: 'New shopkeeper registered', time: '2 hours ago', type: 'success' },
        { id: '3', message: 'New shopkeeper registered', time: '3 hours ago', type: 'success' },
    ];

    const displayActivities = activities || defaultActivities;

    const dotColors = {
        success: 'bg-green-500',
        warning: 'bg-orange-500',
        info: 'bg-blue-500',
    };

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {displayActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                            <div className={`w-2 h-2 rounded-full ${dotColors[activity.type]}`} />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                                <p className="text-xs text-gray-500">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
