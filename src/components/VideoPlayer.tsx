import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { Player } from '@remotion/player';
import { AdVideo } from './video/AdVideo';

export function VideoPlayer() {
  const { videoUrl, script, product } = useStore();

  if (!videoUrl || !script || !product) return null;

  const handleDownload = () => {
    // For now, we'll just download the rendered preview
    // In a production environment, you'd want to implement proper video export
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = 'ad-video.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Your Generated Video Ad</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video relative">
          <Player
            component={AdVideo}
            durationInFrames={450}
            fps={30}
            compositionWidth={1920}
            compositionHeight={1080}
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 300px)',
              imageRendering: '-webkit-optimize-contrast',
              WebkitFontSmoothing: 'antialiased'
            }}
            inputProps={{
              script,
              product,
            }}
            controls
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleDownload} className="w-full">
          Download Video
        </Button>
      </CardFooter>
    </Card>
  );
} 