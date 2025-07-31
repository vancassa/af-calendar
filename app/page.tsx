"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import html2canvas from "html2canvas"
import { Button } from "@/components/ui/button"

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
07.00,Morning Yoga,,,,Morning Yoga,,
08.30,,Cardio Blast,,,Cardio Blast,,
10.00,Aqua Fitness,,,Aqua Fitness,,,
17.00,,,Power Yoga,,,Power Yoga,
18.15,HIIT,Spinning,HIIT,Spinning,HIIT,,
19.00,,Dance Fit,,,Dance Fit,,
20.00,Strength Training,,,Strength Training,,,`,

  Sedayu: `Time,Mon,Tue,Wed,Thurs,Fri,Sat,Sun
07.15,,,Early Bird Yoga,,,Early Bird Yoga,
08.45,Bootcamp,,,Bootcamp,,,
09.30,,Barre Class,,,Barre Class,,
17.30,,,Functional Training,,,Functional Training,
18.45,CrossFit,Yoga Flow,CrossFit,Yoga Flow,CrossFit,,
19.15,,Kickboxing,,,Kickboxing,,
19.45,Core Blast,,,Core Blast,,,`,
}

interface ClassActivity {
  time: string
  day: string
  className: string
  location: string
}

interface TimeSlot {
  time: string
  classes: {
    [key: string]: ClassActivity[]
  }
}

function parseCSV(csvString: string, location: string): ClassActivity[] {
  const lines = csvString.trim().split("\n")
  const headers = lines[0].split(",")
  const activities: ClassActivity[] = []

  const dayMap: { [key: string]: string } = {
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thurs: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
    Sun: "Sunday",
  }

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",")
    const time = values[0]

    for (let j = 1; j < values.length && j < headers.length; j++) {
      const className = values[j]?.trim()
      if (className) {
        const day = dayMap[headers[j]] || headers[j]
        activities.push({
          time,
          day,
          className,
          location,
        })
      }
    }
  }

  return activities
}

function consolidateData(): TimeSlot[] {
  const allActivities: ClassActivity[] = []

  // Parse all CSV data
  Object.entries(csvData).forEach(([location, csv]) => {
    const activities = parseCSV(csv, location)
    allActivities.push(...activities)
  })

  // Group by time
  const timeSlots: { [key: string]: TimeSlot } = {}

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
        },
      }
    }

    if (timeSlots[activity.time].classes[activity.day]) {
      timeSlots[activity.time].classes[activity.day].push(activity)
    }
  })

  // Sort by time
  const sortedTimes = Object.keys(timeSlots).sort((a, b) => {
    const timeA = Number.parseFloat(a.replace(".", ""))
    const timeB = Number.parseFloat(b.replace(".", ""))
    return timeA - timeB
  })

  return sortedTimes.map((time) => timeSlots[time])
}

const locationColors: { [key: string]: string } = {
  MOI: "bg-blue-100 text-blue-800 border-blue-200",
  BellaTerra: "bg-green-100 text-green-800 border-green-200",
  Sedayu: "bg-purple-100 text-purple-800 border-purple-200",
}

const blockedTimeSlots = {
  Monday: [{ start: "18.00", end: "22.00" }],
  Tuesday: [{ start: "06.30", end: "07.30" }],
  Wednesday: [{ start: "20.00", end: "22.00" }],
  Thursday: [{ start: "18.00", end: "22.00" }],
  Friday: [
    { start: "07.00", end: "08.30" },
    { start: "17.00", end: "20.00" },
  ],
}

function isTimeBlocked(time: string, day: string): boolean {
  if (!blockedTimeSlots[day as keyof typeof blockedTimeSlots]) return false

  const timeNum = Number.parseFloat(time.replace(".", ""))
  const blocks = blockedTimeSlots[day as keyof typeof blockedTimeSlots]

  return blocks.some((block) => {
    const startNum = Number.parseFloat(block.start.replace(".", ""))
    const endNum = Number.parseFloat(block.end.replace(".", ""))
    return timeNum >= startNum && timeNum <= endNum
  })
}

export default function ClassCalendar() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [showBlockedTime, setShowBlockedTime] = useState(false)

  useEffect(() => {
    const consolidated = consolidateData()
    setTimeSlots(consolidated)
  }, [])

  const downloadAsImage = async () => {
    const calendarElement = document.getElementById("calendar-container")
    if (!calendarElement) return

    try {
      const canvas = await html2canvas(calendarElement, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
      })

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) return

        // Create download link
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `class-schedule-${new Date().toISOString().split("T")[0]}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, "image/png")
    } catch (error) {
      console.error("Error generating image:", error)
    }
  }

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card id="calendar-container">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Weekly Class Schedule</CardTitle>
          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Badge className={locationColors.MOI}>MOI</Badge>
              <Badge className={locationColors.BellaTerra}>BellaTerra</Badge>
              <Badge className={locationColors.Sedayu}>Sedayu</Badge>
            </div>
          </div>
          <div className="flex justify-center mt-4">
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
          <div className="flex justify-center mt-4">
            <Button onClick={downloadAsImage} className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download as Image
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header */}
              <div className="grid grid-cols-6 gap-2 mb-4">
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
                  <div key={index} className="grid grid-cols-6 gap-2">
                    {/* Time column */}
                    <div className="p-3 bg-gray-50 rounded-lg text-center font-mono text-sm font-medium">
                      {slot.time}
                    </div>

                    {/* Day columns */}
                    {weekdays.map((day) => {
                      const isBlocked = showBlockedTime && isTimeBlocked(slot.time, day)
                      return (
                        <div
                          key={day}
                          className={`p-2 border rounded-lg min-h-[80px] relative ${
                            isBlocked ? "bg-red-50 border-red-200" : "bg-white"
                          }`}
                        >
                          {isBlocked && (
                            <div className="absolute inset-0 bg-red-100 opacity-50 rounded-lg flex items-center justify-center">
                              <div className="text-red-600 font-semibold text-xs transform -rotate-12">BLOCKED</div>
                            </div>
                          )}
                          <div className={`space-y-1 relative z-10 ${isBlocked ? "opacity-30" : ""}`}>
                            {slot.classes[day]?.map((activity, actIndex) => (
                              <div key={actIndex} className="space-y-1">
                                <Badge
                                  variant="outline"
                                  className={`text-xs px-2 py-1 block text-center ${locationColors[activity.location]}`}
                                >
                                  {activity.className}
                                </Badge>
                                <div className="text-xs text-gray-500 text-center">@{activity.location}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
