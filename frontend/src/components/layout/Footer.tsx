import { Github, Linkedin, Facebook, Twitter, Mail } from "lucide-react"
import { Tent } from "lucide-react"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto w-full max-w-screen-xl px-4 py-6 lg:py-8">
        <div className="md:flex md:justify-between">
          <div className="flex mb-6 md:mb-0">
            <a href="/" className="flex items-center">
              <Tent size={32} className="text-primary mr-3" />
              <span className="self-center text-4xl font-semibold whitespace-nowrap text-foreground">
                Safar
              </span>
            </a>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
            <div>
              <h2 className="mb-6 text-sm font-semibold text-foreground uppercase">
                Resources
              </h2>
              <ul className="text-muted-foreground font-medium space-y-4">
                <li>
                  <a
                    href="https://safar.example.com/"
                    className="hover:text-foreground transition-colors"
                  >
                    Safar
                  </a>
                </li>
                <li>
                  <a
                    href="https://tailwindcss.com/"
                    className="hover:text-foreground transition-colors"
                  >
                    Tailwind CSS
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-6 text-sm font-semibold text-foreground uppercase">
                Follow us
              </h2>
              <ul className="text-muted-foreground font-medium space-y-4">
                <li>
                  <a
                    href="https://github.com"
                    className="hover:text-foreground transition-colors"
                  >
                    Github
                  </a>
                </li>
                <li>
                  <a
                    href="https://linkedin.com"
                    className="hover:text-foreground transition-colors"
                  >
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-6 text-sm font-semibold text-foreground uppercase">
                Legal
              </h2>
              <ul className="text-muted-foreground font-medium space-y-4">
                <li>
                  <span className="opacity-60 cursor-not-allowed">
                    Privacy Policy
                  </span>
                </li>
                <li>
                  <span className="opacity-60 cursor-not-allowed">
                    Terms &amp; Conditions
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <hr className="my-6 border-border lg:my-8" />
        <div className="sm:flex sm:items-center sm:justify-between">
          <span className="text-sm text-muted-foreground sm:text-center">
            © {currentYear}{" "}
            <a href="/" className="hover:text-foreground transition-colors">
              Safar™
            </a>
            . All Rights Reserved.
          </span>
          <div className="flex gap-4 mt-4 sm:justify-center sm:mt-0">
            <span className="text-muted-foreground opacity-60 cursor-not-allowed" aria-label="Facebook page">
              <Facebook className="h-5 w-5" />
            </span>
            <span className="text-muted-foreground opacity-60 cursor-not-allowed" aria-label="Twitter page">
              <Twitter className="h-5 w-5" />
            </span>
            <span className="text-muted-foreground opacity-60 cursor-not-allowed" aria-label="LinkedIn account">
              <Linkedin className="h-5 w-5" />
            </span>
            <span className="text-muted-foreground opacity-60 cursor-not-allowed" aria-label="GitHub account">
              <Github className="h-5 w-5" />
            </span>
            <span className="text-muted-foreground opacity-60 cursor-not-allowed" aria-label="Email">
              <Mail className="h-5 w-5" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}