import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { ArrowLeft, Clock, Calendar, User, Share2, Sparkles, ChevronRight, HelpCircle } from 'lucide-react';
import { blogPosts, BlogPost } from '../../../src/data/blogPosts';

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
    <article className="min-h-screen bg-[#FAF7EF] text-[#0c0710] antialiased selection:bg-[#F45D9B] selection:text-white">
      {/* Schema Injection */}
      <Script id="article-schema" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(articleSchema)}
      </Script>
      {post.faqs.length > 0 && (
        <Script id="faq-schema" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(faqSchema)}
        </Script>
      )}

      {/* Atmospheric Ambient Glows & Background Dots */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-25" style={{ backgroundImage: 'radial-gradient(rgba(12,7,16,.15) .75px, transparent .75px)', backgroundSize: '12px 12px' }} />
      <div className="pointer-events-none fixed -top-40 right-10 h-[30rem] w-[30rem] rounded-full bg-[#F45D9B]/10 blur-3xl z-0" />
      <div className="pointer-events-none fixed bottom-10 -left-20 h-96 w-96 rounded-full bg-pink-300/15 blur-3xl z-0" />

      {/* Article Header & Navigation */}
      <header className="relative z-10 border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/60 transition-colors hover:text-[#F45D9B]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span>All Articles</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#F45D9B]/10 px-3 py-1 text-[11px] font-bold text-[#F45D9B]">
              {post.category}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-medium text-black/50">
          <Link href="/" className="hover:text-[#F45D9B]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/blog" className="hover:text-[#F45D9B]">Blog</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate text-black/80">{post.title}</span>
        </nav>

        {/* Title & Metadata */}
        <h1 className="font-geist text-3xl font-black leading-tight tracking-tight text-[#0c0710] sm:text-5xl lg:text-[3.25rem]">
          {post.title}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-black/60 border-y border-black/5 py-3.5">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-[#F45D9B]" />
            <span>{post.author.name}</span>
          </div>
          <span className="text-black/20">•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#F45D9B]" />
            <time dateTime={post.publishedDate}>{post.publishedDate}</time>
          </div>
          <span className="text-black/20">•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#F45D9B]" />
            <span>{post.readTime}</span>
          </div>
        </div>

        {/* Lead Excerpt */}
        <p className="mt-8 text-lg font-medium leading-relaxed text-black/80 sm:text-xl border-l-2 border-[#F45D9B] pl-4 sm:pl-5 italic">
          {post.excerpt}
        </p>

        {/* Article Body */}
        <div className="mt-10 space-y-6 text-base leading-[1.85] text-black/80 sm:text-lg">
          {post.content.map((paragraph, idx) => {
            if (paragraph.startsWith('### ')) {
              return (
                <h2 key={idx} className="font-geist pt-4 text-2xl font-bold tracking-tight text-[#0c0710] sm:text-3xl">
                  {paragraph.replace('### ', '')}
                </h2>
              );
            }
            return <p key={idx}>{paragraph}</p>;
          })}
        </div>

        {/* FAQ Section */}
        {post.faqs.length > 0 && (
          <section className="mt-16 rounded-3xl border border-black/10 bg-white/90 p-6 sm:p-8 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[#F45D9B]">
              <HelpCircle className="h-5 w-5" />
              <h2 className="font-geist text-xl font-bold tracking-tight text-[#0c0710]">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="mt-6 space-y-5">
              {post.faqs.map((faq, index) => (
                <div key={index} className="border-b border-black/5 pb-4 last:border-b-0 last:pb-0">
                  <h3 className="text-base font-bold text-[#0c0710]">
                    {faq.question}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-black/65">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contextual CTA Banner */}
        <div className="mt-16 rounded-3xl border border-[#F45D9B]/30 bg-gradient-to-br from-[#F45D9B]/10 via-pink-50 to-white p-8 text-center shadow-lg">
          <Sparkles className="mx-auto h-8 w-8 text-[#F45D9B]" />
          <h2 className="mt-3 font-geist text-2xl font-black text-[#0c0710] sm:text-3xl">
            Find your people on campus.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-black/65">
            Join verified students at your university for study circles, genuine friendships, anonymous confession walls, and real community.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-[#0c0710] px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:bg-[#F45D9B] hover:shadow-pink-400/20"
            >
              <span>Get Started Free</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 border-t border-black/10 pt-10">
            <h2 className="font-geist text-xl font-black tracking-tight text-[#0c0710]">
              More Campus Stories &amp; Guides
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/blog/${rel.slug}`}
                  className="group rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F45D9B]/40 hover:shadow-md"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F45D9B]">
                    {rel.category}
                  </span>
                  <h3 className="mt-2 text-base font-bold text-[#0c0710] group-hover:text-[#F45D9B] transition-colors line-clamp-2">
                    {rel.title}
                  </h3>
                  <p className="mt-1 text-xs text-black/55 line-clamp-2">
                    {rel.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </article>
  );
}
