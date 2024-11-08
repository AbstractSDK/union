_: {
  perSystem =
    {
      pkgs,
      unstablePkgs,
      lib,
      ensureAtRepositoryRoot,
      mkCi,
      ...
    }:
    let
      pkgsDeps = with pkgs; [ pkg-config ];
      nodeDeps = with unstablePkgs; [ nodePackages_latest.nodejs ];
      combinedDeps = pkgsDeps ++ nodeDeps;
      packageJSON = lib.importJSON ./package.json;
    in
    {
      packages = {
        site = mkCi false (
          unstablePkgs.buildNpmPackage {
            npmDepsHash = "sha256-Q9HbeXkrLI3aomqLxcpIAk+f72KWHOusQdQjRoz/tj4=";
            src = ./.;
            sourceRoot = "site";
            pname = packageJSON.name;
            inherit (packageJSON) version;
            nativeBuildInputs = combinedDeps;
            buildInputs = combinedDeps;
            installPhase = ''
              mkdir -p $out
              cp -r ./.vercel/output/* $out
            '';
            doDist = false;
            PUPPETEER_SKIP_DOWNLOAD = 1;
            ASTRO_TELEMETRY_DISABLED = 1;
            NODE_OPTIONS = "--no-warnings";
          }
        );
      };

      apps = {
        site-dev-server = {
          type = "app";
          program = pkgs.writeShellApplication {
            name = "site-dev-server";
            runtimeInputs = combinedDeps;
            text = ''
              ${ensureAtRepositoryRoot}
              cd site/

              export PUPPETEER_SKIP_DOWNLOAD=1 
              npm install
              npm run dev
            '';
          };
        };
        fmt-site = {
          type = "app";
          program = pkgs.writeShellApplication {
            name = "fmt-site";
            runtimeInputs = combinedDeps;
            text = ''
              ${ensureAtRepositoryRoot}
              cd site/

              export PUPPETEER_SKIP_DOWNLOAD=1 
              npm install

              # This formats the non-frontmatter portion of .astro files
              # TODO: move to treefmt https://treefmt.com/usage
              ./node_modules/prettier/bin/prettier.cjs --plugin=prettier-plugin-astro --write ./**/*.astro || true

              cd ..

              # this re-formats the frontmatter portion, using our biome config
              nix fmt
            '';
          };
        };
        site-check = {
          type = "app";
          program = pkgs.writeShellApplication {
            name = "site-check";
            runtimeInputs = combinedDeps;
            text = ''
              ${ensureAtRepositoryRoot}
              cd site/
              npm_config_yes=true npx astro check
            '';
          };
        };
      };
    };
}
