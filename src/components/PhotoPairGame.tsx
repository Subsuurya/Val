"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// 12 images
const images = [
  "/game-photos/mine-1.avif",
  "/game-photos/mine-2.avif",
  "/game-photos/mine-3.avif",
  "/game-photos/mine-4.avif",
  "/game-photos/mine-5.avif",
  "/game-photos/mine-6.avif",
  "/game-photos/mine-7.avif",
  "/game-photos/mine-8.avif",
  "/game-photos/mine-9.avif",
  "/game-photos/mine-10.avif",
  "/game-photos/mine-11.avif",
  "/game-photos/mine-12.avif",
];

// Create 12 pairs of images (24 cards in total)
const imagePairs = images.flatMap((image) => [image, image]);

const shuffleArray = (array: string[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const heartLayout = [
  [null, 0, 1, null, 2, 3, null],
  [4, 5, 6, 7, 8, 9, 10],
  [null, 11, 12, 13, 14, 15, null],
  [null, 16, 17, 18, 19, 20, null],
  [null, null, 21, 22, 23, null, null],
];

type ValentinesProposalProps = {
  handleShowProposal: () => void;
};

export default function PhotoPairGame({
  handleShowProposal,
}: ValentinesProposalProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [incorrect, setIncorrect] = useState<number[]>([]);
  const [images] = useState(() => shuffleArray([...imagePairs]));
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const imagesLoadedRef = useRef<Set<string>>(new Set());

  // Preload unique images efficiently on mount
  useEffect(() => {
    const uniqueImages = Array.from(new Set(images));
    uniqueImages.forEach((imageSrc) => {
      if (!imagesLoadedRef.current.has(imageSrc)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = imageSrc;
        document.head.appendChild(link);
        imagesLoadedRef.current.add(imageSrc);
      }
    });
  }, [images]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, []);

  const handleClick = useCallback(async (index: number) => {
    if (selected.length === 2 || matched.includes(index) || selected.includes(index)) return;

    if (selected.length === 1) {
      const firstIndex = selected[0];
      setSelected((prev) => [...prev, index]);

      if (images[firstIndex] === images[index]) {
        setMatched((prev) => [...prev, firstIndex, index]);
        setSelected([]);
      } else {
        await new Promise((resolve) => {
          const timeout = setTimeout(resolve, 1000);
          timeoutRefs.current.push(timeout);
        });

        setIncorrect([firstIndex, index]);
        const timeout1 = setTimeout(() => setIncorrect([]), 1000);
        const timeout2 = setTimeout(() => setSelected([]), 1000);
        timeoutRefs.current.push(timeout1, timeout2);
      }
    } else {
      setSelected([index]);
    }
  }, [selected, matched, images]);

  // Check if game is won
  useEffect(() => {
    if (matched.length === imagePairs.length) {
      // Clear any pending timeouts before showing proposal
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current = [];
      handleShowProposal();
    }
  }, [matched, handleShowProposal]);

  // Memoize the flattened layout to avoid recalculating on every render
  const flattenedLayout = useMemo(() => heartLayout.flat(), []);

  return (
    <div className="grid grid-cols-7 gap-1 lg:gap-2 max-w-[95vw] mx-auto place-items-center">
        {flattenedLayout.map((index, i) =>
        index !== null ? (
          <motion.div
            key={i}
            className="w-[11vh] h-[11vh] lg:w-20 lg:h-20 relative cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleClick(index)}
            style={{ perspective: "1000px" }} // Add perspective for 3D effect
          >
            {/* Back of the card */}
            {!selected.includes(index) && !matched.includes(index) && (
              <motion.div
                className="w-full h-full bg-gray-300 rounded-sm lg:rounded-md absolute z-10"
                initial={{ rotateY: 0 }}
                animate={{
                  rotateY:
                    selected.includes(index) || matched.includes(index)
                      ? 180
                      : 0,
                }}
                transition={{ duration: 0.5 }}
                style={{ backfaceVisibility: "hidden" }}
              />
            )}

            {/* Front of the card (image) - always rendered but hidden until needed */}
            <motion.div
              className="w-full h-full absolute"
              initial={{ rotateY: -180 }}
              animate={{ 
                rotateY: (selected.includes(index) || matched.includes(index)) ? 0 : -180,
                opacity: (selected.includes(index) || matched.includes(index)) ? 1 : 0
              }}
              transition={{ duration: 0.5 }}
              style={{ backfaceVisibility: "hidden" }}
            >
              <Image
                src={images[index]}
                alt={`Imagen ${index + 1}`}
                fill
                className="rounded-sm lg:rounded-md object-cover"
                sizes="(max-width: 768px) 11vh, 80px"
                priority={false}
              />
            </motion.div>

            {/* Incorrect animation */}
            {incorrect.includes(index) && (
              <motion.div
                className="absolute inset-0"
                animate={{ scale: [1, 1.1, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-full h-full bg-red-500 rounded-sm lg:rounded-md"></div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <div key={i} className="w-[11vh] h-[11vh] lg:w-20 lg:h-20" />
        ),
      )}
    </div>
  );
}
