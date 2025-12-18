import React from 'react';
import { motion } from 'framer-motion';

const variants = {
    fade: (y = 24) => ({
        hidden: { opacity: 0, y, filter: 'blur(6px)' },
        show: { opacity: 1, y: 0, filter: 'blur(0px)' }
    }),
    clip: () => ({
        hidden: { opacity: 0, clipPath: 'inset(0 0 100% 0)', filter: 'blur(2px)' },
        show: { opacity: 1, clipPath: 'inset(0 0 0% 0)', filter: 'blur(0px)' }
    })
};

/**
 * Reveal: Simple whileInView scroll-reveal wrapper.
 * Props:
 * - variant: 'fade' | 'clip'
 * - delay, duration, y, amount, once, className
 */
const Reveal = ({
    children,
    variant = 'fade',
    delay = 0,
    duration = 0.6,
    y = 24,
    amount = 0.2,
    once = true,
    className = ''
}) => {
    const v = variant === 'clip' ? variants.clip() : variants.fade(y);
    return (
        <motion.div
            className={className}
            initial="hidden"
            whileInView="show"
            viewport={{ once, amount }}
            transition={{ duration, delay }}
            variants={v}
        >
            {children}
        </motion.div>
    );
};

export default Reveal;
