import clsx from 'clsx';
import { About, AboutStatus } from '@/components/apps/About';
import { CaseFile } from '@/components/apps/CaseFile';
import { Contact } from '@/components/apps/Contact';
import { Experience, ExperienceStatus } from '@/components/apps/experience/Experience';
import { Post } from '@/components/apps/Post';
import { Product } from '@/components/apps/Product';
import { Writing } from '@/components/apps/Writing';
import { SceneCanvas } from '@/components/gpu/SceneCanvas';
import { SceneCaption } from '@/components/gpu/SceneCaption';
import { SceneProvider } from '@/components/gpu/SceneProvider';
import { caseFiles } from '@/content/caseFiles';
import { identity, products } from '@/content/resume';
import { getCareerTrace } from '@/lib/careerTrace';
import { listPosts } from '@/lib/posts';
import { AboutComputer } from './AboutComputer';
import { isBitmapName } from './bitmaps';
import { bootCurtainScript } from './bootCurtain';
import { BootLog } from './BootLog';
import styles from './DesktopPage.module.css';
import { DesktopIcons } from './DesktopIcons';
import { HomeScreen } from './HomeScreen';
import { MenuBar } from './MenuBar';
import { PocketDock } from './PocketDock';
import { BootCurtainLifter } from './SceneChrome';
import { ShutDown } from './ShutDown';
import { Window } from './Window';
import { WindowManager } from './WindowManager';

interface DesktopPageProps {
  /** Windows open on arrival besides About, e.g. `case:insights-api` for /work/insights-api. */
  open?: string[];
}

/**
 * The whole site is one desktop. Window bodies render on the server, so every word is in the
 * HTML for readers, search engines and screen readers; only the window chrome is client code.
 */
export async function DesktopPage({ open = [] }: DesktopPageProps) {
  const trace = await getCareerTrace();
  const posts = listPosts();
  // Every desktop window starts open; About goes last so it's on top and focused.
  const initialOpen = [
    'experience',
    'writing',
    ...products.map((p) => p.id),
    'contact',
    'about',
    ...open,
  ];

  return (
    <WindowManager initialOpen={initialOpen}>
      <SceneProvider>
        {/* Runs during HTML parsing, before first paint, so the hero never flashes before the boot. */}
        <script dangerouslySetInnerHTML={{ __html: bootCurtainScript() }} />
        <BootCurtainLifter />
        <SceneCanvas />
        <BootLog />
        <MenuBar />
        <main className={styles.main}>
          <HomeScreen />
          <section id="about" className={styles.desk} aria-label="Desktop">
            <div className={styles.slotAbout} data-boot="hide" data-scene-follow="about">
              <Window
                id="about"
                title="About"
                icon="about"
                labelledBy="about-name"
                status={<AboutStatus />}
              >
                <About />
              </Window>
            </div>
            <div data-boot="hide">
              <DesktopIcons />
            </div>
          </section>

          <section id="work" className={styles.band} aria-label="Experience">
            <div className={styles.slotWide} data-scene-follow="experience">
              <Window
                id="experience"
                title="Experience"
                icon="experience"
                flush
                status={<ExperienceStatus />}
              >
                <Experience trace={trace} />
              </Window>
            </div>
          </section>

          <section id="writing" className={styles.band} aria-label="Writing">
            <div className={styles.slotMedium} data-scene-follow="writing">
              <Window id="writing" title="Writing" icon="writing">
                <Writing posts={posts} />
              </Window>
            </div>
          </section>

          <section id="products" className={styles.band} aria-label="Projects">
            <div className={styles.products}>
              {products.map((product) => (
                <div
                  key={product.id}
                  className={styles[`slot-${product.id}`]}
                  data-scene-follow={product.id}
                >
                  <Window
                    id={product.id}
                    title={product.name}
                    icon={isBitmapName(product.id) ? product.id : 'caseFile'}
                    labelledBy={`product-${product.id}`}
                  >
                    <Product product={product} />
                  </Window>
                </div>
              ))}
            </div>
          </section>

          <section id="contact" className={clsx(styles.band, styles.contact)} aria-label="Contact">
            <div className={styles.slotContact} data-scene-follow="contact">
              <Window id="contact" title="Contact" icon="contact">
                <Contact />
              </Window>
            </div>
            <footer className={clsx(styles.colophon, 'pix')}>
              <span>
                {identity.name}, {identity.location}
              </span>
              <SceneCaption />
              <a href={identity.source}>Source</a>
            </footer>
          </section>
        </main>

        {caseFiles.map((file) => (
          <Window
            key={file.slug}
            id={`case:${file.slug}`}
            title={`${file.slug}.case`}
            icon="caseFile"
            variant="overlay"
            labelledBy={`case-${file.slug}`}
          >
            <CaseFile file={file} />
          </Window>
        ))}
        {posts.map((post) => (
          <Window
            key={post.slug}
            id={`post:${post.slug}`}
            title={`${post.slug}.txt`}
            icon="writing"
            variant="reader"
            labelledBy={`post-${post.slug}`}
          >
            <Post post={post} />
          </Window>
        ))}
        <AboutComputer />
        <PocketDock />
        <ShutDown />
      </SceneProvider>
    </WindowManager>
  );
}
