import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { ArrowLeft, Clock, Calendar, User, Sparkles, ChevronRight, HelpCircle } from 'lucide-react';
import { blogPosts, BlogPost } from '../../../src/data/blogPosts';
import { Footer } from '../../../src/components/Footer';
import { StarField } from '../../../src/components/StarField';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) return {};

  const url = `https://www.othrhalff.in/blog/${post.slug}`;

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      url,
      title: post.metaTitle,
      description: post.metaDescription,
      publishedTime: post.publishedDate,
      modifiedTime: post.modifiedDate,
      authors: [post.author.name],
      tags: post.keywords,
      images: [
        {
          url: post.featuredImage.startsWith('http') ? post.featuredImage : `https://www.othrhalff.in${post.featuredImage}`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle,
      description: post.metaDescription,
      images: [post.featuredImage.startsWith('http') ? post.featuredImage : `https://www.othrhalff.in${post.featuredImage}`],
    },
  };
}

export default function BlogPostPage({ params }: Props) {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) notFound();

  const relatedPosts = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  // Article Schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription,
    image: post.featuredImage.startsWith('http') ? post.featuredImage : `https://www.othrhalff.in${post.featuredImage}`,
    datePublished: post.publishedDate,
    dateModified: post.modifiedDate,
    author: {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Othrhalff',
      url: 'https://www.othrhalff.in',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.othrhalff.in/favicon.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.othrhalff.in/blog/${post.slug}`,
    },
  };

  // FAQPage Schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <article className="relative min-h-screen bg-[#05020c] text-white selection:bg-[#F45D9B] selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Schema Injection */}
      <Script id="article-schema" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(articleSchema)}
      </Script>
      {post.faqs.length > 0 && (
        <Script id="faq-schema" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(faqSchema)}
        </Script>
      )}

      {/* Dynamic StarField Galaxy Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <StarField />
      </div>

      {/* Subtle radial ambient atmosphere */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,50,150,0.12),rgba(5,2,12,0.8))]" />

      {/* Article Header & Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#05020c]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:text-white"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-all duration-200 group-hover:-translate-x-1 group-hover:border-white/25 group-hover:bg-white/10">
              <ArrowLeft className="h-3.5 w-3.5 text-zinc-300 group-hover:text-white" />
            </div>
            <span>All Articles</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-white/[0.06] border border-white/10 px-3 py-1 text-[11px] font-medium text-zinc-300">
              {post.category}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-medium text-zinc-400">
          <Link href="/" className="hover:text-zinc-200">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/blog" className="hover:text-zinc-200">Blog</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate text-zinc-300">{post.title}</span>
        </nav>

        {/* Title & Metadata */}
        <h1 className="font-geist text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
          {post.title}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-400 border-y border-white/[0.08] py-3.5">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-pink-300" />
            <span>{post.author.name}</span>
          </div>
          <span className="text-zinc-600">•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-pink-300" />
            <time dateTime={post.publishedDate}>{post.publishedDate}</time>
          </div>
          <span className="text-zinc-600">•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-pink-300" />
            <span>{post.readTime}</span>
          </div>
        </div>

        {/* Lead Excerpt */}
        <p className="mt-8 text-lg font-normal leading-relaxed text-zinc-300 sm:text-xl border-l-2 border-pink-400/60 pl-4 sm:pl-5 italic bg-white/[0.02] py-2 rounded-r-xl">
          {post.excerpt}
        </p>

        {/* Article Body */}
        <div className="mt-10 space-y-6 text-base leading-[1.85] text-zinc-300 sm:text-lg font-normal">
          {post.content.map((paragraph, idx) => {
            if (paragraph.startsWith('### ')) {
              return (
                <h2 key={idx} className="font-geist pt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {paragraph.replace('### ', '')}
                </h2>
              );
            }
            return <p key={idx}>{paragraph}</p>;
          })}
        </div>

        {/* FAQ Section */}
        {post.faqs.length > 0 && (
          <section className="mt-16 rounded-3xl border border-white/[0.08] bg-zinc-950/60 p-6 sm:p-8 backdrop-blur-xl shadow-lg">
            <div className="flex items-center gap-2 text-pink-300 mb-6">
              <HelpCircle className="h-5 w-5" />
              <h2 className="font-geist text-xl font-bold tracking-tight text-white">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-5">
              {post.faqs.map((faq, index) => (
                <div key={index} className="border-b border-white/[0.06] pb-4 last:border-b-0 last:pb-0">
                  <h3 className="text-base font-semibold text-white">
                    {faq.question}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-400 font-normal">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contextual CTA Banner */}
        <div className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/70 via-zinc-950/80 to-[#05020c] p-8 text-center backdrop-blur-xl shadow-xl">
          <Sparkles className="mx-auto h-7 w-7 text-pink-300" />
          <h2 className="mt-3 font-geist text-2xl font-black text-white sm:text-3xl">
            Find your people on campus.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400 font-normal leading-relaxed">
            Join verified students at your university for study circles, genuine friendships, anonymous confession walls, and real community.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-white text-zinc-950 px-6 py-3 text-sm font-semibold shadow-md transition-all duration-300 hover:bg-zinc-200 hover:scale-105"
            >
              <span>Get Started Free</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 border-t border-white/[0.08] pt-10">
            <h2 className="font-geist text-xl font-bold tracking-tight text-white mb-6">
              More Campus Stories &amp; Guides
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/blog/${rel.slug}`}
                  className="group rounded-2xl border border-white/[0.08] bg-zinc-950/50 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-zinc-900/40"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-pink-300">
                    {rel.category}
                  </span>
                  <h3 className="mt-2 text-base font-bold text-white group-hover:text-pink-200 transition-colors line-clamp-2">
                    {rel.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                    {rel.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </article>
  );
}
