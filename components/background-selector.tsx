"use client"

import type React from "react"

import { useState } from "react"
import { ImageIcon, Palette, Video } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type BackgroundType = "gradient" | "image" | "video"

type Background = {
  type: BackgroundType
  gradient: string
  image: string
  video: string
}

interface BackgroundSelectorProps {
  currentBackground: Background
  onBackgroundChange: (background: Background) => void
}

const gradients = [
  "bg-gradient-to-br from-rose-500 to-indigo-700",
  "bg-gradient-to-br from-blue-500 to-purple-700",
  "bg-gradient-to-br from-green-400 to-blue-600",
  "bg-gradient-to-br from-yellow-400 to-orange-600",
  "bg-gradient-to-br from-pink-500 to-purple-900",
  "bg-gradient-to-br from-indigo-500 to-cyan-400",
  "bg-gradient-to-br from-slate-900 to-slate-700",
  "bg-gradient-to-br from-emerald-500 to-teal-900",
]

const videos = ["/videos/forest.mp4", "/videos/ocean.mp4", "/videos/rain.mp4", "/videos/fireplace.mp4"]

export default function BackgroundSelector({ currentBackground, onBackgroundChange }: BackgroundSelectorProps) {
  const [activeTab, setActiveTab] = useState<BackgroundType>(currentBackground.type)
  const [imageUrl, setImageUrl] = useState(currentBackground.image)
  const [videoUrl, setVideoUrl] = useState(currentBackground.video)

  const handleGradientSelect = (gradient: string) => {
    onBackgroundChange({
      ...currentBackground,
      type: "gradient",
      gradient,
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setImageUrl(imageUrl)
      onBackgroundChange({
        ...currentBackground,
        type: "image",
        image: imageUrl,
      })
    }
  }

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)
  }

  const applyImageUrl = () => {
    if (imageUrl) {
      onBackgroundChange({
        ...currentBackground,
        type: "image",
        image: imageUrl,
      })
    }
  }

  const handleVideoSelect = (video: string) => {
    onBackgroundChange({
      ...currentBackground,
      type: "video",
      video,
    })
  }

  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setVideoUrl(url)
  }

  const applyVideoUrl = () => {
    if (videoUrl) {
      onBackgroundChange({
        ...currentBackground,
        type: "video",
        video: videoUrl,
      })
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20"
        >
          {currentBackground.type === "gradient" ? (
            <Palette className="h-5 w-5 text-white" />
          ) : currentBackground.type === "image" ? (
            <ImageIcon className="h-5 w-5 text-white" />
          ) : (
            <Video className="h-5 w-5 text-white" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <Tabs
          defaultValue={currentBackground.type}
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as BackgroundType)}
        >
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="gradient">Gradient</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
          </TabsList>

          <TabsContent value="gradient" className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {gradients.map((gradient, index) => (
                <button
                  key={index}
                  className={cn(
                    gradient,
                    "h-12 w-full rounded-md transition-all",
                    currentBackground.gradient === gradient && "ring-2 ring-white",
                  )}
                  onClick={() => handleGradientSelect(gradient)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={handleImageUrlChange}
                />
                <Button onClick={applyImageUrl} size="sm">
                  Apply
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="imageUpload">Or upload an image</Label>
              <Input id="imageUpload" type="file" accept="image/*" onChange={handleImageUpload} />
            </div>

            {currentBackground.type === "image" && currentBackground.image && (
              <div className="mt-2">
                <div className="text-xs text-muted-foreground mb-1">Current Image</div>
                <div
                  className="h-20 w-full bg-cover bg-center rounded-md"
                  style={{ backgroundImage: `url(${currentBackground.image})` }}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="video" className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <div className="flex gap-2">
                <Input
                  id="videoUrl"
                  placeholder="https://example.com/video.mp4"
                  value={videoUrl}
                  onChange={handleVideoUrlChange}
                />
                <Button onClick={applyVideoUrl} size="sm">
                  Apply
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Sample Videos</Label>
              <div className="grid grid-cols-2 gap-2">
                {videos.map((video, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={cn("h-10 text-xs", currentBackground.video === video && "border-primary")}
                    onClick={() => handleVideoSelect(video)}
                  >
                    Video {index + 1}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
