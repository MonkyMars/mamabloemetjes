'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../../components/Button';
import {
  FiHeart,
  FiUsers,
  FiAward,
  FiStar,
  FiArrowRight,
  FiMapPin,
  FiClock,
  FiMail,
} from 'react-icons/fi';

const AboutPage: React.FC = () => {
  const values = [
    {
      icon: <FiHeart className='w-8 h-8' />,
      title: 'Crafted with Love',
      description:
        'Every flower is handmade with attention to detail and genuine care, ensuring each piece carries the love and passion we put into our craft.',
    },
    {
      icon: <FiUsers className='w-8 h-8' />,
      title: 'Personal Connection',
      description:
        'We believe in building meaningful relationships with our customers, understanding their vision, and creating flowers that tell their unique story.',
    },
    {
      icon: <FiAward className='w-8 h-8' />,
      title: 'Quality First',
      description:
        'Using only premium velvet materials and time-tested techniques, we ensure every arrangement meets our high standards of beauty and durability.',
    },
  ];

  const team = [
    {
      name: 'Maria van den Berg',
      role: 'Founder & Master Artisan',
      bio: 'With over 15 years of experience in floral design, Maria founded Mama Bloemetjes to share her passion for creating lasting beauty.',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b977?w=300&h=300&fit=crop&crop=face',
    },
    {
      name: 'Sophie Janssen',
      role: 'Lead Designer',
      bio: 'Sophie specializes in wedding arrangements and custom designs, bringing fresh creativity to traditional velvet flower crafting.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',
    },
    {
      name: 'Emma de Wit',
      role: 'Customer Experience',
      bio: 'Emma ensures every customer receives personalized attention and helps bring their floral visions to life.',
      image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=300&fit=crop&crop=face',
    },
  ];

  const milestones = [
    {
      year: '2018',
      title: 'The Beginning',
      description: 'Maria started creating velvet flowers from her Amsterdam studio.',
    },
    {
      year: '2019',
      title: 'First Collection',
      description: 'Launched our signature wedding collection with 12 unique designs.',
    },
    {
      year: '2021',
      title: 'Team Expansion',
      description: 'Welcomed Sophie and Emma to help serve our growing community.',
    },
    {
      year: '2023',
      title: 'Online Presence',
      description: 'Launched our online store to reach customers across the Netherlands.',
    },
  ];

  return (
    <div className='min-h-screen pt-24 pb-16'>
      {/* Hero Section */}
      <section className='section'>
        <div className='container'>
          <div className='max-w-4xl mx-auto text-center mb-16'>
            <h1 className='heading-1 mb-6'>Our Story</h1>
            <p className='text-xl text-[#7d6b55] leading-relaxed'>
              At Mama Bloemetjes, we believe that some moments deserve flowers that last forever.
              Our handcrafted velvet flowers capture the beauty of nature while creating lasting
              memories for life&apos;s most precious occasions.
            </p>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
            <div className='space-y-6'>
              <h2 className='heading-2 text-[#2d2820]'>From Passion to Purpose</h2>
              <div className='space-y-4 text-[#7d6b55] leading-relaxed'>
                <p>
                  What started as a personal hobby in 2018 has blossomed into a boutique studio
                  that serves customers across the Netherlands. Our founder, Maria, discovered
                  her love for velvet flower crafting while planning her own wedding, searching
                  for flowers that would preserve the beauty of her special day forever.
                </p>
                <p>
                  Today, Mama Bloemetjes is more than just a flower shop – we&apos;re keepers of
                  memories, creators of heirlooms, and partners in your most important celebrations.
                  Each piece we create carries with it the story of the person who will treasure it.
                </p>
                <p>
                  Located in the heart of Amsterdam, our studio is where tradition meets innovation,
                  where each velvet petal is shaped by hand, and where your vision becomes a
                  beautiful reality that will last for generations.
                </p>
              </div>
            </div>

            <div className='relative'>
              <div className='aspect-square overflow-hidden rounded-3xl bg-[#f5f2ee] shadow-strong'>
                <Image
                  src='https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=600&fit=crop'
                  alt='Maria crafting velvet flowers in her Amsterdam studio'
                  fill
                  className='object-cover'
                />
              </div>

              {/* Floating testimonial */}
              <div className='absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-strong max-w-sm'>
                <div className='flex items-center space-x-1 mb-3'>
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className='w-4 h-4 fill-current text-yellow-400' />
                  ))}
                </div>
                <p className='text-sm text-[#7d6b55] mb-3'>
                  &ldquo;The attention to detail and craftsmanship is incredible. These flowers
                  will be treasured in our family for generations.&rdquo;
                </p>
                <p className='text-xs font-medium text-[#2d2820]'>— Sarah M., Bride</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className='section section-alt'>
        <div className='container'>
          <div className='text-center mb-16'>
            <h2 className='heading-2 mb-4'>Our Values</h2>
            <p className='text-lg text-[#7d6b55] max-w-2xl mx-auto'>
              These principles guide everything we do, from the selection of materials
              to the final presentation of your custom arrangement.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {values.map((value, index) => (
              <div key={index} className='card p-8 text-center group hover:scale-105 transition-transform duration-300'>
                <div className='w-16 h-16 bg-gradient-to-br from-[#d4a574] to-[#ddb7ab] rounded-2xl flex items-center justify-center text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300'>
                  {value.icon}
                </div>
                <h3 className='heading-4 mb-4'>{value.title}</h3>
                <p className='text-[#7d6b55] leading-relaxed'>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className='section'>
        <div className='container'>
          <div className='text-center mb-16'>
            <h2 className='heading-2 mb-4'>Meet Our Team</h2>
            <p className='text-lg text-[#7d6b55] max-w-2xl mx-auto'>
              The talented artisans behind every beautiful arrangement, dedicated to
              bringing your floral dreams to life.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {team.map((member, index) => (
              <div key={index} className='card p-8 text-center group'>
                <div className='relative w-32 h-32 mx-auto mb-6'>
                  <div className='w-32 h-32 rounded-full overflow-hidden bg-[#f5f2ee] shadow-medium group-hover:shadow-strong transition-shadow duration-300'>
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className='object-cover group-hover:scale-105 transition-transform duration-300'
                    />
                  </div>
                </div>
                <h3 className='text-xl font-serif font-semibold text-[#2d2820] mb-2'>
                  {member.name}
                </h3>
                <p className='text-[#d4a574] font-medium mb-4'>{member.role}</p>
                <p className='text-[#7d6b55] text-sm leading-relaxed'>{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className='section section-alt'>
        <div className='container'>
          <div className='text-center mb-16'>
            <h2 className='heading-2 mb-4'>Our Journey</h2>
            <p className='text-lg text-[#7d6b55] max-w-2xl mx-auto'>
              From a small studio to serving customers across the Netherlands,
              here&apos;s how our story has unfolded.
            </p>
          </div>

          <div className='max-w-4xl mx-auto'>
            <div className='relative'>
              {/* Timeline line */}
              <div className='absolute left-8 top-0 bottom-0 w-0.5 bg-[#d4a574] hidden md:block'></div>

              <div className='space-y-12'>
                {milestones.map((milestone, index) => (
                  <div key={index} className='relative flex items-start space-x-8'>
                    {/* Timeline dot */}
                    <div className='flex-shrink-0 w-16 h-16 bg-[#d4a574] rounded-full flex items-center justify-center text-white font-serif font-bold text-lg shadow-medium'>
                      {milestone.year.slice(-2)}
                    </div>

                    <div className='flex-1 card p-6'>
                      <div className='flex items-center justify-between mb-4'>
                        <h3 className='text-xl font-serif font-semibold text-[#2d2820]'>
                          {milestone.title}
                        </h3>
                        <span className='text-[#d4a574] font-medium'>{milestone.year}</span>
                      </div>
                      <p className='text-[#7d6b55] leading-relaxed'>{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visit Studio Section */}
      <section className='section'>
        <div className='container'>
          <div className='card p-8 lg:p-12 bg-gradient-to-br from-[#d4a574] to-[#ddb7ab] text-white'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
              <div>
                <h2 className='text-3xl font-serif font-bold mb-4'>
                  Visit Our Amsterdam Studio
                </h2>
                <p className='text-white/90 mb-6 leading-relaxed'>
                  We&apos;d love to welcome you to our studio where the magic happens.
                  Schedule a visit to see our artisans at work, browse our collection,
                  or discuss your custom project in person.
                </p>

                <div className='space-y-4 mb-8'>
                  <div className='flex items-center space-x-3'>
                    <FiMapPin className='w-5 h-5 text-white/80' />
                    <span>Bloemenstraat 123, 1234 AB Amsterdam</span>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <FiClock className='w-5 h-5 text-white/80' />
                    <span>Monday - Friday: 9:00 - 17:00</span>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <FiMail className='w-5 h-5 text-white/80' />
                    <span>hello@mamabloemetjes.nl</span>
                  </div>
                </div>

                <div className='flex flex-col sm:flex-row gap-4'>
                  <Link href='/contact'>
                    <Button
                      variant='secondary'
                      size='lg'
                      className='bg-white text-[#d4a574] hover:bg-white/90'
                    >
                      Schedule Visit
                    </Button>
                  </Link>
                  <Link href='/shop'>
                    <Button
                      variant='outline'
                      size='lg'
                      className='border-white text-white hover:bg-white hover:text-[#d4a574]'
                      rightIcon={<FiArrowRight className='w-5 h-5' />}
                    >
                      Browse Collection
                    </Button>
                  </Link>
                </div>
              </div>

              <div className='relative aspect-square'>
                <div className='w-full h-full rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm'>
                  <Image
                    src='https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&h=500&fit=crop'
                    alt='Our Amsterdam studio interior'
                    fill
                    className='object-cover'
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='section section-alt'>
        <div className='container'>
          <div className='text-center max-w-3xl mx-auto'>
            <h2 className='heading-2 mb-6'>Ready to Create Something Beautiful?</h2>
            <p className='text-lg text-[#7d6b55] mb-8 leading-relaxed'>
              Whether you&apos;re planning a wedding, celebrating an anniversary, or simply want
              to add lasting beauty to your home, we&apos;re here to help you create something
              truly special.
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link href='/contact'>
                <Button
                  variant='primary'
                  size='lg'
                  rightIcon={<FiHeart className='w-5 h-5' />}
                >
                  Start Your Project
                </Button>
              </Link>
              <Link href='/shop'>
                <Button
                  variant='outline'
                  size='lg'
                  rightIcon={<FiArrowRight className='w-5 h-5' />}
                >
                  Explore Collection
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
