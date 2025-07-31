"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Sample CSV data for demonstration
const csvData = {
  MOI: `Time,Mon,Tue,Wed,Thurs,Fri,Sat,Sun
07.30,,Hatha Yoga,,,Hatha Yoga,Pilates,
08.00,,,Zumba,Body Combat,,,BollyX
09.00,Pilates,,,,,Body Combat,Body Jam
18.00,,,,,AF Ignite,,
18.30,Dance Cardio,Pilates,Kpop,Pound Fit,,,
19.30,Body Combat,Zumba,BollyX,Body Combat,Freestyle,,`,

  BellaTerra: `Time,Mon,Tue,Wed,Thurs,Fri,Sat,Sun
06.30,,,Basic Yoga,,,,
07.00,Body Combat,Hatha Yoga,,Body Pump,Pilates,,
08.00,,Tabata,,Bootcamp,,Body Pump,
18.00,Zumba,Dance,Body Combat,Pilates,Body Combat,,
19.00,Body Pump,Basic Yoga,Zumba,,Pound,,
20.00,,Cardio,,,Vinyasa Yoga,,`,

  Sedayu: `Time,Mon,Tue,Wed,Thurs,Fri,Sat,Sun
08.00,Hatha Yoga,Body Combat,Vinyasa Yoga,Body Pump,Yoga Asanas,,
10.00,,,,,,Bootcamp,AF Ignite
17.00,,,,,,Booty & Abs,Fast Fit
18.15,BollyX,Pound Fit,Latin Dance,Barre Intensity,Zumba,,
19.15,Kpop,Matt Pilates,Step Aerobic,BollyX,,,
19.30,,,,,Body Pump,,`,

  SunterMall: `Time,Mon,Tue,Wed,Thurs,Fri,Sat,Sun
09.00,HIIT,,,,,,
10.00,Zumba,Body Combat,Bootcamp,Zumba,Body Pump,Body Pump,Dance Fitness
18.00,Pound Fit,Aerobic,,Aerobic,,,
19.05,Body Pump,Pilates,Body Combat,Dance Fitness,Yoga,Zumba,
20.10,Yoga Stretch,Zumba,,Yoga,Body Combat,,`,
};

interface ClassActivity {
  time: string;
  day: string;
  className: string;
  location: string;
}

interface TimeSlot {
  time: string;
  classes: {
    [key: string]: ClassActivity[];
  };
}

function parseCSV(csvString: string, location: string): ClassActivity[] {
  const lines = csvString.trim().split("\n");
  const headers = lines[0].split(",");
  const activities: ClassActivity[] = [];

  const dayMap: { [key: string]: string } = {
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thurs: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
    Sun: "Sunday",
  };

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const time = values[0];

    for (let j = 1; j < values.length && j < headers.length; j++) {
      const className = values[j]?.trim();
      if (className) {
        const day = dayMap[headers[j]] || headers[j];
        activities.push({
          time,
          day,
          className,
          location,
        });
      }
    }
  }

  return activities;
}

function consolidateData(): { morning: TimeSlot[]; evening: TimeSlot[] } {
  const allActivities: ClassActivity[] = [];

  // Parse all CSV data
  Object.entries(csvData).forEach(([location, csv]) => {
    const activities = parseCSV(csv, location);
    allActivities.push(...activities);
  });

  // Group by time
  const timeSlots: { [key: string]: TimeSlot } = {};

  allActivities.forEach((activity) => {
    if (!timeSlots[activity.time]) {
      timeSlots[activity.time] = {
        time: activity.time,
        classes: {
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
          Saturday: [],
          Sunday: [],
        },
      };
    }

    if (timeSlots[activity.time].classes[activity.day]) {
      timeSlots[activity.time].classes[activity.day].push(activity);
    }
  });

  // Sort by time
  const sortedTimes = Object.keys(timeSlots).sort((a, b) => {
    const timeA = Number.parseFloat(a.replace(".", ""));
    const timeB = Number.parseFloat(b.replace(".", ""));
    return timeA - timeB;
  });

  const allTimeSlots = sortedTimes.map((time) => timeSlots[time]);

  // Separate morning and evening sessions
  const morning = allTimeSlots.filter((slot) => {
    const timeNum = Number.parseFloat(slot.time);
    return timeNum < 12.0; // Before 12 PM (noon)
  });

  const evening = allTimeSlots.filter((slot) => {
    const timeNum = Number.parseFloat(slot.time);
    return timeNum >= 17.0; // 5 PM and after
  });

  return { morning, evening };
}

const locationColors: { [key: string]: string } = {
  MOI: "bg-blue-100 text-blue-800 border-blue-200",
  BellaTerra: "bg-green-100 text-green-800 border-green-200",
  Sedayu: "bg-purple-100 text-purple-800 border-purple-200",
  SunterMall: "bg-orange-100 text-orange-800 border-orange-200",
};

const blockedTimeSlots = {
  Monday: [
    { start: "18.00", end: "22.00" },
    { start: "09.00", end: "11.00" },
  ],
  Tuesday: [
    { start: "06.30", end: "07.30" },
    { start: "09.00", end: "11.00" },
  ],
  Wednesday: [
    { start: "19.30", end: "22.00" },
    { start: "09.00", end: "11.00" },
  ],
  Thursday: [
    { start: "18.00", end: "22.00" },
    { start: "09.00", end: "11.00" },
  ],
  Friday: [
    { start: "07.00", end: "08.30" },
    { start: "09.00", end: "11.00" },
    { start: "17.00", end: "20.00" },
  ],
};

function isTimeBlocked(time: string, day: string): boolean {
  if (!blockedTimeSlots[day as keyof typeof blockedTimeSlots]) return false;

  const timeNum = Number.parseFloat(time.replace(".", ""));
  const blocks = blockedTimeSlots[day as keyof typeof blockedTimeSlots];

  return blocks.some((block) => {
    const startNum = Number.parseFloat(block.start.replace(".", ""));
    const endNum = Number.parseFloat(block.end.replace(".", ""));
    return timeNum >= startNum && timeNum <= endNum;
  });
}

function SessionCalendar({
  timeSlots,
  sessionTitle,
  showBlockedTime,
}: {
  timeSlots: TimeSlot[];
  sessionTitle: string;
  showBlockedTime: boolean;
}) {
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  if (timeSlots.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center text-gray-500">
            {sessionTitle} - No Classes Scheduled
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">{sessionTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header */}
            <div className="grid grid-cols-8 gap-2 mb-4">
              <div className="font-semibold text-center p-3 bg-gray-100 rounded-lg">Time</div>
              {weekdays.map((day) => (
                <div key={day} className="font-semibold text-center p-3 bg-gray-100 rounded-lg">
                  {day}
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div className="space-y-2">
              {timeSlots.map((slot, index) => (
                <div key={index} className="grid grid-cols-8 gap-2">
                  {/* Time column */}
                  <div className="p-3 bg-gray-50 rounded-lg text-center font-mono text-sm font-medium">{slot.time}</div>

                  {/* Day columns */}
                  {weekdays.map((day) => {
                    const isBlocked = showBlockedTime && isTimeBlocked(slot.time, day);
                    return (
                      <div
                        key={day}
                        className={`p-2 border rounded-lg relative flex flex-col justify-start ${
                          isBlocked ? "bg-red-50 border-red-200" : "bg-white"
                        }`}
                      >
                        {isBlocked && (
                          <div className="absolute inset-0 bg-red-100 opacity-50 rounded-lg flex items-center justify-center"></div>
                        )}
                        <div className={`space-y-2 relative z-10 ${isBlocked ? "opacity-30" : ""}`}>
                          {slot.classes[day]?.map((activity, actIndex) => (
                            <div key={actIndex} className="space-y-1">
                              <Badge
                                variant="outline"
                                className={`text-xs px-2 py-1.5 block text-center leading-tight flex items-center justify-center min-h-[24px] ${
                                  locationColors[activity.location]
                                }`}
                              >
                                {activity.className}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClassCalendar() {
  const [sessions, setSessions] = useState<{ morning: TimeSlot[]; evening: TimeSlot[] }>({ morning: [], evening: [] });
  const [showBlockedTime, setShowBlockedTime] = useState(false);

  useEffect(() => {
    const consolidated = consolidateData();
    setSessions(consolidated);
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Controls outside of the downloadable container */}
      <div className="flex justify-center items-center gap-6 mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showBlockedTime}
            onChange={(e) => setShowBlockedTime(e.target.checked)}
            className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
          />
          <span className="text-sm font-medium text-gray-700">Show blocked time</span>
        </label>
      </div>

      <div id="calendar-container">
        {/* Main Header */}
        <Card className="mb-6">
          <CardHeader>
            {/* Add month */}
            <CardTitle className="text-3xl font-bold text-center">
              Class Schedule {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
            </CardTitle>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Badge className={locationColors.MOI}>MOI</Badge>
                <Badge className={locationColors.BellaTerra}>BellaTerra</Badge>
                <Badge className={locationColors.Sedayu}>Sedayu</Badge>
                <Badge className={locationColors.SunterMall}>SunterMall</Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Morning Session */}
        <SessionCalendar
          timeSlots={sessions.morning}
          sessionTitle="Morning Session (Before 12:00 PM)"
          showBlockedTime={showBlockedTime}
        />

        {/* Evening Session */}
        <SessionCalendar
          timeSlots={sessions.evening}
          sessionTitle="Evening Session (5:00 PM & After)"
          showBlockedTime={showBlockedTime}
        />
      </div>
    </div>
  );
}
