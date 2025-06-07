"use client"

import type React from "react"

import { useState } from "react"
import { ImageIcon, Palette, Video, Sparkles } from "lucide-react"
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
  "bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500",
  "bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600",
  "bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600",
  "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500",
  "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
  "bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900",
  "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700",
  "bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600",
  "bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500",
  "bg-gradient-to-br from-purple-600 via-pink-600 to-red-500",
  "bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600",
  "bg-gradient-to-br from-emerald-300 via-blue-500 to-purple-600",
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
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-xl text-white hover:bg-white/20 transition-all duration-300 group relative"
          title="Change Background"
        >
          {currentBackground.type === "gradient" ? (
            <Palette className="h-5 w-5 group-hover:scale-110 transition-transform" />
          ) : currentBackground.type === "image" ? (
            <ImageIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
          ) : (
            <Video className="h-5 w-5 group-hover:scale-110 transition-transform" />
          )}
          <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 bg-white/10 backdrop-blur-2xl border-white/20 rounded-2xl" align="end">
        <div className="p-2">
          <div className="flex items-center space-x-2 mb-4">
            <Palette className="h-5 w-5 text-white" />
            <h3 className="text-white font-semibold">Background Studio</h3>
          </div>

          <Tabs
            defaultValue={currentBackground.type}
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as BackgroundType)}
          >
            <TabsList className="grid grid-cols-3 mb-4 bg-white/10 rounded-xl">
              <TabsTrigger value="gradient" className="rounded-lg data-[state=active]:bg-white/20">
                Gradients
              </TabsTrigger>
              <TabsTrigger value="image" className="rounded-lg data-[state=active]:bg-white/20">
                Images
              </TabsTrigger>
              <TabsTrigger value="video" className="rounded-lg data-[state=active]:bg-white/20">
                Videos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gradient" className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {gradients.map((gradient, index) => (
                  <button
                    key={index}
                    className={cn(
                      gradient,
                      "h-16 w-full rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg",
                      currentBackground.gradient === gradient && "ring-2 ring-white scale-105 shadow-lg",
                    )}
                    onClick={() => handleGradientSelect(gradient)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-4">
              <div className="grid gap-3">
                <Label htmlFor="imageUrl" className="text-white font-medium">
                  Image URL
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={handleImageUrlChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl"
                  />
                  <Button
                    onClick={applyImageUrl}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl"
                  >
                    Apply
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="imageUpload" className="text-white font-medium">
                  Upload Image
                </Label>
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="bg-white/10 border-white/20 text-white file:bg-white/20 file:text-white file:border-0 file:rounded-lg rounded-xl"
                />
              </div>

              {currentBackground.type === "image" && currentBackground.image && (
                <div className="mt-3">
                  <div className="text-xs text-white/70 mb-2">Current Image</div>
                  <div
                    className="h-24 w-full bg-cover bg-center rounded-xl border border-white/20"
                    style={{ backgroundImage: `url(${currentBackground.image})` }}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="video" className="space-y-4">
              <div className="grid gap-3">
                <Label htmlFor="videoUrl" className="text-white font-medium">
                  Video URL
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="videoUrl"
                    placeholder="https://example.com/video.mp4"
                    value={videoUrl}
                    onChange={handleVideoUrlChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl"
                  />
                  <Button
                    onClick={applyVideoUrl}
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 rounded-xl"
                  >
                    Apply
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                <Label className="text-white font-medium">Sample Videos</Label>
                <div className="grid grid-cols-2 gap-2">
                  {videos.map((video, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className={cn(
                        "h-12 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl transition-all duration-300",
                        currentBackground.video === video && "bg-white/20 border-white/40 scale-105",
                      )}
                      onClick={() => handleVideoSelect(video)}
                    >
                      Video {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  )
}
