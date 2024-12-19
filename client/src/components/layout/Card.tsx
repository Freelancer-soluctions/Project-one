import { useRef, useEffect, useState } from 'react';

interface CardProps {
    item: {
      title: string;
      url: string;
      description: string;
    };
  }
  
const Card = ({ item }: CardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) observer.unobserve(cardRef.current);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-1000 ease-in-out transform opacity-0 translate-y-10 ${
        isVisible ? 'opacity-100 translate-y-0' : ''
      }`}>
      <article className='h-[600px] mx-auto md:w-[400px] bg-sixth-color md:p-10 p-5 rounded-3xl max-h-full grid items-center'>
        <img
          src='https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse2.mm.bing.net%2Fth%3Fid%3DOIP.itObVrzbVufFqBDPMlVwLAAAAA%26pid%3DApi&f=1&ipt=4b5eeb0a134c618e36f57698ca728b56e956bf4cc18e6542b8e3fbf11ac65bf8&ipo=images'
          alt='examples-2'
          className='rounded-3xl mx-auto object-cover'
        />

        <div className='pt-3 space-y-3'>
          <a className='text-md font-medium' href='#'>
            {item.url}
          </a>
          <h4 className='text-xl md:text-2xl font-medium'>{item.title}</h4>
          <p className='font-sans text-lg'>{item.description}</p>
        </div>
      </article>
    </div>
  );
};

export default Card;
