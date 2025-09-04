'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  generateTrendingTopics,
  type TrendingTopicsOutput,
} from '@/ai/flows/trending-topics-generation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Flame, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  interests: z.string().min(1, 'Please enter at least one interest.'),
});

export function TrendingTopics() {
  const [trendingTopics, setTrendingTopics] =
    useState<TrendingTopicsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      interests: 'technology, startups, artificial intelligence',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setTrendingTopics(null);
    try {
      const result = await generateTrendingTopics({
        platformDescription:
          'TrendStream is a modern social media app, similar to VKontakte, where users share posts, photos, and videos with friends and followers.',
        userInterests: values.interests,
      });
      setTrendingTopics(result);
    } catch (error) {
      console.error('Failed to generate trending topics:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate trending topics. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Discover Trending Topics</CardTitle>
              <CardDescription>
                Enter your interests (comma-separated) to find what's hot right
                now.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Interests</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., gaming, travel, food"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Flame className="mr-2 h-4 w-4" />
                    Generate Topics
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {trendingTopics && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Here's what's trending for you</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {trendingTopics.topics.map((topic, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-base px-3 py-1 bg-accent/20 border-accent/50 text-accent-foreground hover:bg-accent/30 cursor-pointer"
              >
                # {topic}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
