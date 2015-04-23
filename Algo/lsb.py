from PIL import Image


def playHead(max, pixel=0, component=0):
    current = (pixel, component)
    i = 0
    while i < max:
        yield current
        if current[1] == 2:
            current = (current[0] + 1, 0)
        else:
            current = (current[0], current[1] + 1)
        i += 1


def linear2matrix(n, cols):
    return (n % cols, n // cols)


def writeBitInImage(bit, img, head, cols):
    (n_pixel, component) = next(head)
    (col, row) = linear2matrix(n_pixel, cols)
    pixel = img.getpixel((col, row))
    new_pixel = (
        int(bin(pixel[0])[:7] + bit, 2) if component == 0 else pixel[0],
        int(bin(pixel[1])[:7] + bit, 2) if component == 1 else pixel[1],
        int(bin(pixel[2])[:7] + bit, 2) if component == 2 else pixel[2]
    )
    img.putpixel((col, row), new_pixel)
    return component


def readBitInImage(img, head, cols):
    (n_pixel, component) = next(head)
    (col, row) = linear2matrix(n_pixel, cols)
    pixel = img.getpixel((col, row))
    return (bin(pixel[component])[-1], component)


def lsb(msg, img, filename='out.png', verb=True):
    size = len(msg)
    image = Image.open(img)
    (width, height) = image.size
    nb_pixels = width * height
    head = playHead(nb_pixels)
    encoded = image.copy()

    if nb_pixels < (3 * size + 6):
        print("Image trop petite pour y intégrer le message")
        exit(1)

    # Insertion de la taille du message
    b_size = '{:016d}'.format(int(bin(size)[2:]))
    if verb:
        print("Écriture de la taille : {} soit {}b".format(size, b_size))
    for bit in b_size:
        last_component = writeBitInImage(bit, encoded, head, width)

    # On avance la tête jusqu'au prochain pixel
    while last_component != 2:
        (pixel, last_component) = next(head)

    # Insertion du message
    for c in msg:
        car = '{:08d}'.format(int(bin(ord(c))[2:]))
        if verb:
            print("Écriture du caractère : {} soit {}b".format(c, car))
        for bit in car:
            last_component = writeBitInImage(bit, encoded, head, width)
        # On avance la tête jusqu'au prochain pixel
        while last_component != 2:
            (pixel, last_component) = next(head)

    encoded.save(filename)


def detect_lsb(img, verb=True):
    image = Image.open(img)
    (width, height) = image.size
    nb_pixels = width * height
    head = playHead(nb_pixels)
    size = ''
    msg = ''

    # On récupère la taille du message
    for i in range(16):
        bit, last_component = readBitInImage(image, head, width)
        size += bit
    final_size = int(size, 2)
    if verb:
        print("Taille : {}b soit {} caractères".format(size, final_size))

    # On avance la tête jusqu'au prochain pixel
    while last_component != 2:
        (pixel, last_component) = next(head)

    # On récupère le message
    for i in range(final_size):
        car = ''
        for j in range(8):
            bit, last_component = readBitInImage(image, head, width)
            car += bit
        final_car = chr(int(car, 2))
        msg += final_car
        if verb:
            print("Caractère: {}b soit {}".format(car, final_car))
        # On avance la tête jusqu'au prochain pixel
        while last_component != 2:
            (pixel, last_component) = next(head)

    return msg


if __name__ == '__main__':
    lsb("GNU/Linux Magazine", "lena.png")
    msg = detect_lsb("out.png")
    print(msg)
