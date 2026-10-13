import clsx from 'clsx';
import { PixelIcon } from '@/components/os/PixelIcon';
import { isBitmapName } from '@/components/os/bitmaps';
import type { Product as ProductData } from '@/content/types';
import styles from './Product.module.css';

const host = (url: string) => new URL(url).host;

export function Product({ product }: { product: ProductData }) {
  const headingId = `product-${product.id}`;
  return (
    <article aria-labelledby={headingId}>
      <div className={styles.head}>
        <PixelIcon
          name={isBitmapName(product.id) ? product.id : 'caseFile'}
          scale={4}
          className={styles.icon}
        />
        <div>
          <h2 className={clsx(styles.name, 'pix')} id={headingId}>
            {product.name}
          </h2>
          <a
            className={clsx(styles.url, 'pix')}
            href={product.url}
            target="_blank"
            rel="noreferrer"
          >
            {host(product.url)}
          </a>
        </div>
      </div>
      <p className={styles.summary}>{product.summary}</p>
      <ul className={styles.highlights}>
        {product.highlights.map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>
      <p className={styles.stack}>{product.stack.join(', ')}</p>
      <div className={clsx(styles.links, 'pix')}>
        <a className="btn" href={product.url} target="_blank" rel="noreferrer">
          Visit {host(product.url)}
        </a>
        {product.source && (
          <a className="btn" href={product.source} target="_blank" rel="noreferrer">
            Source
          </a>
        )}
      </div>
    </article>
  );
}
