serve:
	npm run serve

build: install
	npm run build

lint:
	npm run lint

deb:
	dpkg-buildpackage --tar-ignore=node_modules --build=full

install: | node_modules/
	npm install

clean:
	rm -f debian/files
	rm -f debian/fruitnanny-ui.substvars
	rm -fr debian/fruitnanny-ui
