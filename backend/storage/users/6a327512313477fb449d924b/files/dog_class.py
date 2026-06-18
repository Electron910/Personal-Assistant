
class Dog:
    def __init__(self, name, breed, age):
        self.name = name
        self.breed = breed
        self.age = age

    def bark(self):
        return f"{self.name} says Woof!"

    def get_human_age(self):
        return self.age * 7

# Creating instances of the Dog class
my_dog = Dog("Buddy", "Golden Retriever", 5)
your_dog = Dog("Lucy", "Labrador", 3)

# Accessing attributes
print(f"{my_dog.name} is a {my_dog.breed}.")
print(f"{your_dog.name} is {your_dog.age} years old.")

# Calling methods
print(my_dog.bark())
print(f"{your_dog.name} is {your_dog.get_human_age()} in human years.")
